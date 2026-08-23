-- ============================================================================
-- Sadhana Connect — Phase 20D: Multiple mentors per devotee
--
-- Approved reversal of the Phase 1 design decision that a devotee has
-- exactly one active mentor at a time. A devotee may now have up to 3
-- active mentors simultaneously (approved cap). Assigning an additional
-- mentor no longer deactivates any existing assignment — that swap
-- behavior is retired entirely in favor of two independent actions:
-- assign a mentor (this migration's new RPC) and remove a mentor (the
-- already-existing plain UPDATE the app performs via
-- useDeactivateAssignment/mentor_assignments_update RLS — no change
-- needed there, it already operates on one assignment row at a time and
-- was never swap-shaped to begin with).
--
-- 1. mentor_assignments_one_active_mentor_per_devotee (0001) — a unique
--    partial index on (devotee_id) WHERE is_active — is replaced by a
--    unique partial index on (mentor_id, devotee_id) WHERE is_active.
--    This still prevents the one duplicate that would actually be a
--    bug (the same mentor actively assigned to the same devotee twice)
--    while allowing different mentors to co-exist.
--
-- 2. A new BEFORE INSERT OR UPDATE OF is_active trigger enforces the
--    approved cap of 3 active mentors per devotee — this is a
--    database-level invariant (CLAUDE.md: security/business rules
--    enforced server-side, not only in the RPC or the UI), so it holds
--    regardless of which path an insert/reactivation takes. It takes a
--    transaction-scoped advisory lock keyed on devotee_id before
--    counting — stronger than reassign_devotee's (0005) own `for
--    update` row lock, which only protects against racing an UPDATE to
--    an already-existing row, not two concurrent INSERTs each adding a
--    brand-new row (see the in-function comment for why) — so two
--    concurrent assignments to the same devotee can't both slip past
--    the count check and jointly exceed the cap.
--
-- 3. public.reassign_devotee(uuid, uuid) is dropped and replaced by
--    public.assign_devotee_to_mentor(uuid, uuid) — same SECURITY
--    INVOKER / is_super_admin() fast-fail shape, same devotee/mentor
--    role+active validation, same same-mentor no-op behavior, but it
--    never deactivates any other assignment. The unique partial index
--    and the cap trigger are the final backstops against a duplicate or
--    over-cap insert, exactly as reassign_devotee relied on the old
--    unique index as its own final backstop.
--
-- No RLS policy changes: mentor_assignments_insert/_update already
-- require private.is_super_admin() (0001) and are untouched.
-- validate_mentor_assignment_roles() (0001) already re-validates
-- mentor/devotee roles on every INSERT/UPDATE regardless of entry path
-- and is untouched.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------
-- 1. Replace the one-mentor-per-devotee unique index with a
--    one-pair-per-(mentor,devotee) unique index.
-- ----------------------------------------------------------------------

drop index if exists public.mentor_assignments_one_active_mentor_per_devotee;

create unique index if not exists mentor_assignments_one_active_pair
  on public.mentor_assignments (mentor_id, devotee_id)
  where is_active;

-- ----------------------------------------------------------------------
-- 2. Cap enforcement trigger — max 3 active mentors per devotee
--    (approved limit).
-- ----------------------------------------------------------------------

create or replace function public.enforce_mentor_assignment_cap()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_active_count integer;
begin
  -- Serialize against any other concurrent INSERT/UPDATE targeting the
  -- same devotee_id before counting. A `for update` row lock on the
  -- existing active rows (reassign_devotee's own 0005 pattern) is not
  -- enough here: it only locks rows that already existed at the start
  -- of this statement, so a second concurrent transaction blocked on
  -- that lock would NOT see a row a first transaction newly INSERTed
  -- once unblocked (Postgres does not rescan for brand-new rows on
  -- unblock, only re-checks already-matched rows). A transaction-scoped
  -- advisory lock keyed on devotee_id instead serializes ALL concurrent
  -- callers for this devotee_id — including inserts racing other
  -- inserts, not just inserts racing updates — which closes that gap.
  perform pg_advisory_xact_lock(hashtext(new.devotee_id::text));

  select count(*) into v_active_count
  from public.mentor_assignments
  where devotee_id = new.devotee_id
    and is_active
    and id <> new.id;

  if v_active_count >= 3 then
    raise exception 'MENTOR_CAP_REACHED: This devotee already has the maximum of 3 active mentors.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_mentor_assignments_enforce_cap on public.mentor_assignments;
create trigger trg_mentor_assignments_enforce_cap
  before insert or update of is_active on public.mentor_assignments
  for each row
  when (new.is_active)
  execute function public.enforce_mentor_assignment_cap();

revoke execute on function public.enforce_mentor_assignment_cap() from public;

-- ----------------------------------------------------------------------
-- 3. assign_devotee_to_mentor() replaces reassign_devotee() — additive
--    only, never deactivates any other assignment.
-- ----------------------------------------------------------------------

drop function if exists public.reassign_devotee(uuid, uuid);

create or replace function public.assign_devotee_to_mentor(
  p_devotee_id uuid,
  p_mentor_id uuid
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
  v_existing public.mentor_assignments;
  v_new_assignment public.mentor_assignments;
begin
  if not private.is_super_admin() then
    raise exception 'Only a super admin may assign a devotee to a mentor.'
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
  from public.profiles where id = p_mentor_id;

  if not found then
    raise exception 'mentor_id % does not exist', p_mentor_id
      using errcode = '23503';
  end if;

  if v_mentor_role is distinct from 'mentor' then
    raise exception 'mentor_id % must reference a profile with role = mentor', p_mentor_id
      using errcode = '23514';
  end if;

  if not v_mentor_active then
    raise exception 'mentor_id % must be an active profile', p_mentor_id
      using errcode = '23514';
  end if;

  -- No-op case: already actively assigned to this exact mentor. Return
  -- the existing row unchanged rather than raising a duplicate error —
  -- same reasoning reassign_devotee used for the identical case.
  select * into v_existing
  from public.mentor_assignments
  where devotee_id = p_devotee_id and mentor_id = p_mentor_id and is_active;

  if found then
    return v_existing;
  end if;

  -- The unique partial index (mentor_assignments_one_active_pair, above)
  -- and the cap trigger (enforce_mentor_assignment_cap, above) are the
  -- final, unconditional guarantees against a conflicting duplicate or
  -- an over-cap insert.
  insert into public.mentor_assignments (mentor_id, devotee_id, is_active, assigned_by)
  values (p_mentor_id, p_devotee_id, true, auth.uid())
  returning * into v_new_assignment;

  return v_new_assignment;
end;
$$;

revoke execute on function public.assign_devotee_to_mentor(uuid, uuid) from public;
grant execute on function public.assign_devotee_to_mentor(uuid, uuid) to authenticated;

commit;
