-- ============================================================================
-- Sadhana Connect — Phase 14: Super Admin support
--
-- Three additions, all reusing existing authorization primitives with no new
-- RLS policies:
--   1. profiles.anonymized_at — distinguishes Disabled from Anonymized/
--      Deleted without inferring anything from full_name.
--   2. reassign_devotee() — atomic reassignment, SECURITY INVOKER, relies
--      entirely on the caller's own RLS privileges (no elevation).
--   3. admin_mentor_assignment_counts — aggregate view, same
--      security_invoker = true pattern as 0003_mentor_devotee_last_reports.
--
-- profiles.email and temple_groups.is_active are deliberately NOT added in
-- this migration (approved decisions): email would be exposed to mentors
-- under existing row-level (not column-level) profiles RLS, and temple
-- group deactivation is deferred — existing create/rename/delete (delete
-- already safely blocked by ON DELETE RESTRICT while in use) is sufficient
-- for now.
-- ============================================================================

begin;

-- ============================================================================
-- 1. profiles.anonymized_at
--
-- NULL = never anonymized. Non-null = the anonymization timestamp.
-- Combined with is_active, this gives the three required statuses:
--   Active:   is_active = true
--   Disabled: is_active = false AND anonymized_at IS NULL
--   Deleted:  is_active = false AND anonymized_at IS NOT NULL
-- ============================================================================

alter table public.profiles
  add column if not exists anonymized_at timestamptz;

-- Defensive integrity constraint: an anonymized profile can never be
-- simultaneously active. This is a backstop, not the primary enforcement —
-- the application never offers "Enable" on a Deleted account — but it makes
-- that rule impossible to violate even by a future/direct write path that
-- forgets to check it.
--
-- ALTER TABLE ... ADD CONSTRAINT has no native IF NOT EXISTS, so this is
-- guarded the same way 0001_initial_schema.sql guards CREATE TYPE app_role
-- — replay-safe if this migration is ever re-run.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_anonymized_requires_inactive'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_anonymized_requires_inactive
      check (anonymized_at is null or not is_active);
  end if;
end;
$$;

-- Extend the existing column-protection trigger so anonymized_at joins
-- role/is_active/temple_group_id as a super-admin-only column. Same
-- function, same trigger binding (section 16 of 0001) — no new trigger.
create or replace function public.protect_profile_restricted_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (
    new.role is distinct from old.role
    or new.is_active is distinct from old.is_active
    or new.temple_group_id is distinct from old.temple_group_id
    or new.anonymized_at is distinct from old.anonymized_at
  ) and not private.is_super_admin() then
    raise exception
      'Only a super admin may change role, is_active, temple_group_id, or anonymized_at.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

-- ============================================================================
-- 2. reassign_devotee()
--
-- SECURITY INVOKER (not DEFINER): every statement inside runs with the
-- CALLER's own privileges. The private.is_super_admin() check below is a
-- fast, friendly failure — the real enforcement is that a non-admin
-- caller's UPDATE/INSERT on mentor_assignments would already be rejected by
-- mentor_assignments_update/mentor_assignments_insert RLS regardless of
-- whether this early check existed at all. No privilege is granted here
-- that the caller didn't already have.
--
-- Wraps operations a super admin could already perform as separate
-- statements (deactivate old active assignment, insert new one) — this
-- function exists purely for atomicity (single transaction, row-locked)
-- plus centralized validation, not for new capability.
-- ============================================================================

create or replace function public.reassign_devotee(
  p_devotee_id uuid,
  p_new_mentor_id uuid
)
returns public.mentor_assignments
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_devotee_role public.app_role;
  v_devotee_active boolean;
  v_mentor_role public.app_role;
  v_mentor_active boolean;
  v_current public.mentor_assignments;
  v_new_assignment public.mentor_assignments;
begin
  if not private.is_super_admin() then
    raise exception 'Only a super admin may reassign devotees.'
      using errcode = '42501';
  end if;

  select role, is_active into v_devotee_role, v_devotee_active
  from public.profiles where id = p_devotee_id;

  if not found then
    raise exception 'devotee_id % does not exist', p_devotee_id
      using errcode = '23503';
  end if;

  if v_devotee_role is distinct from 'devotee' then
    raise exception 'devotee_id % must reference a profile with role = devotee', p_devotee_id
      using errcode = '23514';
  end if;

  if not v_devotee_active then
    raise exception 'devotee_id % must be an active profile', p_devotee_id
      using errcode = '23514';
  end if;

  select role, is_active into v_mentor_role, v_mentor_active
  from public.profiles where id = p_new_mentor_id;

  if not found then
    raise exception 'mentor_id % does not exist', p_new_mentor_id
      using errcode = '23503';
  end if;

  if v_mentor_role is distinct from 'mentor' then
    raise exception 'mentor_id % must reference a profile with role = mentor', p_new_mentor_id
      using errcode = '23514';
  end if;

  if not v_mentor_active then
    raise exception 'mentor_id % must be an active profile', p_new_mentor_id
      using errcode = '23514';
  end if;

  -- Lock the devotee's current active assignment row (if any) so a
  -- concurrent reassignment of the same devotee can't race this one. If no
  -- active row exists, this locks nothing and the INSERT below is this
  -- devotee's first-ever assignment.
  select * into v_current
  from public.mentor_assignments
  where devotee_id = p_devotee_id and is_active
  for update;

  -- No-op case: already actively assigned to this exact mentor. Return the
  -- existing row unchanged rather than deactivating + reinserting, so
  -- assigned_at/history isn't churned by a redundant "reassignment" to the
  -- same mentor.
  if found and v_current.mentor_id = p_new_mentor_id then
    return v_current;
  end if;

  if found then
    update public.mentor_assignments
    set is_active = false, unassigned_at = now()
    where id = v_current.id;
  end if;

  -- The partial unique index (mentor_assignments_one_active_mentor_per_devotee,
  -- defined in 0001) is the final, unconditional guarantee against a
  -- conflicting active assignment — even if two calls somehow interleave
  -- past the row lock above, the second INSERT here fails loudly rather
  -- than silently corrupting state.
  insert into public.mentor_assignments (mentor_id, devotee_id, is_active, assigned_by)
  values (p_new_mentor_id, p_devotee_id, true, auth.uid())
  returning * into v_new_assignment;

  return v_new_assignment;
end;
$$;

revoke execute on function public.reassign_devotee(uuid, uuid) from public;
grant execute on function public.reassign_devotee(uuid, uuid) to authenticated;

-- ============================================================================
-- 3. admin_mentor_assignment_counts
--
-- Same precedent as 0003_mentor_devotee_last_reports: security_invoker =
-- true, zero new authorization logic. Runs with the CALLING role's own
-- privileges, so mentor_assignments_select RLS applies exactly as if the
-- caller ran the GROUP BY themselves — a super admin sees every mentor's
-- count; a mentor querying this view directly would only ever see their own
-- row (not harmful, simply unused by the mentor-facing UI).
-- ============================================================================

create or replace view public.admin_mentor_assignment_counts
with (security_invoker = true)
as
  select mentor_id, count(*) as active_devotee_count
  from public.mentor_assignments
  where is_active
  group by mentor_id;

grant select on public.admin_mentor_assignment_counts to authenticated;

commit;
