-- ============================================================================
-- Sadhana Connect — Phase 2: Initial database architecture
--
-- Consolidated bootstrap migration. Every schema change after this one gets
-- its own incrementally-numbered migration file — this single-file treatment
-- applies only to the from-scratch initial schema.
--
-- Wrapped in an explicit transaction for atomicity: either the whole schema
-- applies, or none of it does.
-- ============================================================================

begin;

-- ============================================================================
-- 1. Extensions
-- ============================================================================

-- gen_random_uuid() is native to PostgreSQL 13+, but pgcrypto is enabled
-- defensively/idempotently in case it is relied on elsewhere. Installed into
-- Supabase's dedicated `extensions` schema (already present in every
-- Supabase project) rather than `public`, per Supabase convention.
create extension if not exists pgcrypto with schema extensions;

-- ============================================================================
-- 2. app_role enum
-- ============================================================================

-- CREATE TYPE has no native IF NOT EXISTS, so guard it explicitly.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('devotee', 'mentor', 'super_admin');
  end if;
end;
$$;

-- ============================================================================
-- 3. private schema
--
-- Holds internal RLS authorization helper functions. This schema is never
-- added to the Supabase project's "Exposed schemas" API setting, so nothing
-- inside it is reachable via PostgREST/RPC regardless of EXECUTE grants.
-- ============================================================================

create schema if not exists private;

-- ============================================================================
-- 4. temple_groups
-- ============================================================================

create table if not exists public.temple_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint temple_groups_name_key unique (name),
  constraint temple_groups_name_not_blank check (char_length(trim(name)) > 0)
);

-- ============================================================================
-- 5. profiles
--
-- 1:1 extension of auth.users. No credentials live here — Supabase Auth owns
-- those entirely. Row is created only by the handle_new_user() trigger
-- (section 12); there is no INSERT path for the `authenticated` role.
--
-- profiles.id -> auth.users.id is ON DELETE RESTRICT (not CASCADE): true
-- hard deletion of a user account is out of scope for this phase (see the
-- account lifecycle notes near the RLS policies below), and this constraint
-- makes that a database-enforced fact, not just an application convention.
-- ============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete restrict,
  full_name text not null,
  role public.app_role not null default 'devotee',
  temple_group_id uuid references public.temple_groups (id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_not_blank check (char_length(trim(full_name)) > 0)
);

-- ============================================================================
-- 6. mentor_assignments
--
-- Append-only event log, not a mutable pointer: reassignment deactivates the
-- old row (is_active = false, unassigned_at = now()) and inserts a new one,
-- rather than overwriting history. mentor_id/devotee_id -> profiles.id are
-- ON DELETE RESTRICT so assignment history can never silently disappear.
-- ============================================================================

create table if not exists public.mentor_assignments (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.profiles (id) on delete restrict,
  devotee_id uuid not null references public.profiles (id) on delete restrict,
  is_active boolean not null default true,
  assigned_at timestamptz not null default now(),
  unassigned_at timestamptz,
  assigned_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mentor_assignments_not_self check (mentor_id <> devotee_id)
);

-- ============================================================================
-- 7. sadhana_reports
--
-- One row per devotee per calendar day. profile_id -> profiles.id is
-- ON DELETE RESTRICT: a profile with any submitted reports cannot be
-- deleted — this is the core historical record the system exists to protect.
--
-- rounds_before_4_30am, rounds_till_7am, and total_rounds are intentionally
-- three independent columns with no cross-field CHECK between them — their
-- relationship (cumulative checkpoints vs. independent counts) has not been
-- confirmed, so no relationship is assumed or enforced here.
-- ============================================================================

create table if not exists public.sadhana_reports (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete restrict,
  report_date date not null,
  rounds_before_4_30am smallint not null default 0,
  rounds_till_7am smallint not null default 0,
  last_round_time time,
  total_rounds smallint not null default 0,
  reading_minutes smallint not null default 0,
  book_name text,
  hearing_minutes smallint not null default 0,
  speaker_name text,
  sleep_time time,
  wake_time time,
  day_rest_minutes smallint not null default 0,
  total_rest_minutes smallint not null default 0,
  office_going_time time,
  office_return_time time,
  notes text,
  signature_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sadhana_reports_one_per_devotee_per_day unique (profile_id, report_date),
  constraint sadhana_reports_signature_not_blank check (char_length(trim(signature_text)) > 0),
  constraint sadhana_reports_rounds_before_430_nonneg check (rounds_before_4_30am >= 0),
  constraint sadhana_reports_rounds_till_7_nonneg check (rounds_till_7am >= 0),
  constraint sadhana_reports_total_rounds_nonneg check (total_rounds >= 0),
  constraint sadhana_reports_reading_minutes_nonneg check (reading_minutes >= 0),
  constraint sadhana_reports_hearing_minutes_nonneg check (hearing_minutes >= 0),
  constraint sadhana_reports_day_rest_minutes_nonneg check (day_rest_minutes >= 0),
  constraint sadhana_reports_total_rest_minutes_nonneg check (total_rest_minutes >= 0)
);

-- ============================================================================
-- 8. announcements
--
-- Broadcast content, decoupled from per-user delivery (see notifications).
-- author_id -> profiles.id is ON DELETE SET NULL: content should outlive its
-- author's account. temple_group_id -> temple_groups.id is ON DELETE
-- RESTRICT: deleting a group must never silently delete historical
-- announcements scoped to it.
-- ============================================================================

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles (id) on delete set null,
  title text not null,
  content text not null,
  scope text not null default 'all',
  temple_group_id uuid references public.temple_groups (id) on delete restrict,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint announcements_title_not_blank check (char_length(trim(title)) > 0),
  constraint announcements_content_not_blank check (char_length(trim(content)) > 0),
  constraint announcements_scope_valid check (scope in ('all', 'temple_group', 'mentors', 'devotees')),
  constraint announcements_temple_group_scope_consistency check (
    scope <> 'temple_group' or temple_group_id is not null
  )
);

-- ============================================================================
-- 9. notifications
--
-- Per-recipient delivery/read-state record. Does not duplicate announcement
-- content — it optionally references one. Populated via fanout-on-write
-- (one row per targeted recipient at publish/event time), always by
-- system/service-role, never by a direct client INSERT (see RLS policies).
-- recipient_id -> profiles.id is ON DELETE CASCADE: a personal inbox is not
-- historically protected data the way reports/assignments are.
-- ============================================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  related_announcement_id uuid references public.announcements (id) on delete cascade,
  related_report_id uuid references public.sadhana_reports (id) on delete cascade,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notifications_title_not_blank check (char_length(trim(title)) > 0),
  constraint notifications_type_valid check (
    type in ('sadhana_reminder', 'mentor_comment', 'announcement', 'system')
  )
);

-- ============================================================================
-- 10. Indexes and unique constraints
--
-- (The unique constraints on temple_groups.name and
-- sadhana_reports(profile_id, report_date) were already created as table
-- constraints above; only additional indexes are added here.)
-- ============================================================================

-- profiles
create index if not exists profiles_temple_group_idx
  on public.profiles (temple_group_id);

create index if not exists profiles_role_idx
  on public.profiles (role);

-- mentor_assignments
create unique index if not exists mentor_assignments_one_active_mentor_per_devotee
  on public.mentor_assignments (devotee_id)
  where is_active;

create index if not exists mentor_assignments_mentor_active_idx
  on public.mentor_assignments (mentor_id)
  where is_active;

create index if not exists mentor_assignments_devotee_idx
  on public.mentor_assignments (devotee_id);

-- sadhana_reports
create index if not exists sadhana_reports_report_date_idx
  on public.sadhana_reports (report_date);

-- announcements
create index if not exists announcements_published_feed_idx
  on public.announcements (is_published, published_at desc);

create index if not exists announcements_temple_group_scope_idx
  on public.announcements (temple_group_id)
  where scope = 'temple_group';

create index if not exists announcements_author_idx
  on public.announcements (author_id);

-- notifications
create index if not exists notifications_recipient_feed_idx
  on public.notifications (recipient_id, created_at desc);

create index if not exists notifications_recipient_unread_idx
  on public.notifications (recipient_id)
  where not is_read;

-- ============================================================================
-- 11. updated_at trigger function
--
-- SECURITY INVOKER (default): only mutates the row already being modified by
-- a statement that has already passed table grants + RLS — no elevated
-- privilege is needed.
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- 12. handle_new_user() trigger function
--
-- SECURITY DEFINER: must bypass profiles RLS to insert from an auth-trigger
-- context that has no authenticated session. Fires once per new auth.users
-- row (see trigger in section 16).
--
-- Safety properties:
--   * role is HARDCODED to 'devotee' — client signup metadata is never read
--     for this field, so a crafted {"role": "super_admin"} in signup
--     metadata has no effect whatsoever.
--   * full_name falls back to 'New Devotee' if missing, blank, or
--     whitespace-only, so profile creation can never fail due to missing
--     metadata. raw_user_meta_data ->> 'full_name' is also safe if
--     raw_user_meta_data itself is null (Postgres ->> on null jsonb yields
--     null, not an error).
--   * ON CONFLICT (id) DO NOTHING guards against an accidental double-fire.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full_name text;
begin
  v_full_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');

  insert into public.profiles (id, full_name, role, is_active)
  values (
    new.id,
    coalesce(v_full_name, 'New Devotee'),
    'devotee',
    true
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- ============================================================================
-- 13. protect_profile_restricted_columns() trigger function
--
-- SECURITY INVOKER: only compares OLD/NEW of the row already being updated
-- and calls the already-SECURITY DEFINER private.is_super_admin() for the
-- elevated check, so it needs no elevated privilege of its own.
--
-- RLS (section 18) governs row-level visibility for UPDATE; this trigger is
-- the column-level guard on top of it — a client cannot self-elevate role,
-- reactivate/deactivate their own account, or reassign their own temple
-- group, even though the row-level UPDATE policy otherwise permits them to
-- update their own row.
--
-- Note: this function is defined before private.is_super_admin() exists
-- (section 15). That is safe — plpgsql function bodies are opaque text at
-- CREATE FUNCTION time and are only resolved against real objects when the
-- function actually executes, by which point section 15 has run.
-- ============================================================================

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
  ) and not private.is_super_admin() then
    raise exception 'Only a super admin may change role, is_active, or temple_group_id.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

-- ============================================================================
-- 14. validate_mentor_assignment_roles() trigger function
--
-- SECURITY DEFINER: deliberately looks up mentor_id/devotee_id's roles
-- itself rather than depending on the invoking role's own visibility into
-- profiles, so this validation stays correct even if mentor_assignments'
-- outer RLS policy shape changes later. A plain CHECK constraint cannot do
-- this — Postgres CHECK constraints cannot reference other tables.
-- ============================================================================

create or replace function public.validate_mentor_assignment_roles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mentor_role public.app_role;
  v_devotee_role public.app_role;
begin
  select role into v_mentor_role from public.profiles where id = new.mentor_id;
  select role into v_devotee_role from public.profiles where id = new.devotee_id;

  if v_mentor_role is distinct from 'mentor' then
    raise exception 'mentor_id % must reference a profile with role = mentor', new.mentor_id
      using errcode = '23514';
  end if;

  if v_devotee_role is distinct from 'devotee' then
    raise exception 'devotee_id % must reference a profile with role = devotee', new.devotee_id
      using errcode = '23514';
  end if;

  return new;
end;
$$;

-- ============================================================================
-- 15. private RLS helper functions
--
-- All SECURITY DEFINER, owned by the migration role (has BYPASSRLS in
-- Supabase), with search_path pinned to prevent search_path hijacking. This
-- combination avoids the "infinite recursion detected in policy for
-- relation profiles" error that a plain subquery inside a profiles policy
-- would cause. Live in the `private` schema — never exposed via PostgREST,
-- regardless of the EXECUTE grants applied in section 20.
-- ============================================================================

create or replace function private.is_super_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'super_admin' and is_active
  );
$$;

create or replace function private.is_active_profile(target uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select is_active from profiles where id = target), false);
$$;

create or replace function private.is_mentor_of(target uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from mentor_assignments ma
    join profiles mentor on mentor.id = ma.mentor_id
    join profiles devotee on devotee.id = ma.devotee_id
    where ma.devotee_id = target
      and ma.mentor_id = auth.uid()
      and ma.is_active
      and mentor.role = 'mentor'
      and mentor.is_active
      and devotee.is_active
  );
$$;

create or replace function private.can_publish_announcement(p_scope text, p_temple_group_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select case
    when private.is_super_admin() then true
    when exists (
      select 1 from profiles where id = auth.uid() and role = 'mentor' and is_active
    ) then
      p_scope = 'temple_group'
      and p_temple_group_id is not null
      and p_temple_group_id is not distinct from (
        select temple_group_id from profiles where id = auth.uid()
      )
    else false
  end;
$$;

-- ============================================================================
-- 16. Triggers
-- ============================================================================

create or replace trigger trg_temple_groups_set_updated_at
  before update on public.temple_groups
  for each row execute function public.set_updated_at();

create or replace trigger trg_profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace trigger trg_mentor_assignments_set_updated_at
  before update on public.mentor_assignments
  for each row execute function public.set_updated_at();

create or replace trigger trg_sadhana_reports_set_updated_at
  before update on public.sadhana_reports
  for each row execute function public.set_updated_at();

create or replace trigger trg_announcements_set_updated_at
  before update on public.announcements
  for each row execute function public.set_updated_at();

create or replace trigger trg_notifications_set_updated_at
  before update on public.notifications
  for each row execute function public.set_updated_at();

-- Bootstraps a profiles row for every new Supabase Auth account.
create or replace trigger trg_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace trigger trg_profiles_protect_restricted_columns
  before update on public.profiles
  for each row execute function public.protect_profile_restricted_columns();

create or replace trigger trg_mentor_assignments_validate_roles
  before insert or update on public.mentor_assignments
  for each row execute function public.validate_mentor_assignment_roles();

-- ============================================================================
-- 17. RLS enablement
--
-- The Supabase project was created with automatic RLS disabled, so every
-- application table must be enabled explicitly. No table ships without this.
-- ============================================================================

alter table public.temple_groups enable row level security;
alter table public.profiles enable row level security;
alter table public.mentor_assignments enable row level security;
alter table public.sadhana_reports enable row level security;
alter table public.announcements enable row level security;
alter table public.notifications enable row level security;

-- ============================================================================
-- 18. RLS policies
--
-- Where a table has no policy for a given operation below, that operation is
-- intentionally left with no policy at all: Postgres RLS defaults to denying
-- an operation entirely for roles subject to RLS when no policy grants it.
-- This is documented inline at each deliberate omission rather than left
-- implicit.
-- ============================================================================

-- ---- profiles ----------------------------------------------------------

-- The own-row branch (id = auth.uid()) intentionally has no is_active_profile
-- gate: a disabled user must still be able to read their own profile row so
-- the application can see is_active = false and render an "account disabled"
-- state, rather than an opaque empty/broken result. All other access to this
-- disabled user's data (reports, notifications, mentor visibility, etc.) is
-- still cut off elsewhere via is_active_profile() — this exception is scoped
-- to "can see my own status flag" only.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select
  on public.profiles
  for select
  to authenticated
  using (
    id = auth.uid()
    or private.is_mentor_of(id)
    or private.is_super_admin()
  );

-- No INSERT policy: rows are created only by the handle_new_user() trigger,
-- which runs SECURITY DEFINER as the table-owning role (BYPASSRLS) — the
-- `authenticated` role has no INSERT path onto this table at all.

drop policy if exists profiles_update on public.profiles;
create policy profiles_update
  on public.profiles
  for update
  to authenticated
  using (
    (id = auth.uid() and private.is_active_profile(auth.uid()))
    or private.is_super_admin()
  )
  with check (
    (id = auth.uid() and private.is_active_profile(auth.uid()))
    or private.is_super_admin()
  );

-- No DELETE policy: profiles are never hard-deleted through the API. Account
-- removal is the controlled deactivation/anonymization flow (UPDATE), not a
-- DELETE — see the Tier 2 account lifecycle notes below.

-- ---- temple_groups ------------------------------------------------------

drop policy if exists temple_groups_select on public.temple_groups;
create policy temple_groups_select
  on public.temple_groups
  for select
  to authenticated
  using (true);

drop policy if exists temple_groups_insert on public.temple_groups;
create policy temple_groups_insert
  on public.temple_groups
  for insert
  to authenticated
  with check (private.is_super_admin());

drop policy if exists temple_groups_update on public.temple_groups;
create policy temple_groups_update
  on public.temple_groups
  for update
  to authenticated
  using (private.is_super_admin())
  with check (private.is_super_admin());

drop policy if exists temple_groups_delete on public.temple_groups;
create policy temple_groups_delete
  on public.temple_groups
  for delete
  to authenticated
  using (private.is_super_admin());

-- ---- mentor_assignments ---------------------------------------------------

drop policy if exists mentor_assignments_select on public.mentor_assignments;
create policy mentor_assignments_select
  on public.mentor_assignments
  for select
  to authenticated
  using (
    (
      (mentor_id = auth.uid() or devotee_id = auth.uid())
      and private.is_active_profile(auth.uid())
    )
    or private.is_super_admin()
  );

drop policy if exists mentor_assignments_insert on public.mentor_assignments;
create policy mentor_assignments_insert
  on public.mentor_assignments
  for insert
  to authenticated
  with check (private.is_super_admin());

drop policy if exists mentor_assignments_update on public.mentor_assignments;
create policy mentor_assignments_update
  on public.mentor_assignments
  for update
  to authenticated
  using (private.is_super_admin())
  with check (private.is_super_admin());

-- No DELETE policy for anyone, including super_admin: this table is
-- append-only by design so mentor-assignment history can never disappear.
-- Reassignment is an UPDATE (deactivate) + INSERT (new active row).

-- ---- sadhana_reports --------------------------------------------------

drop policy if exists sadhana_reports_select on public.sadhana_reports;
create policy sadhana_reports_select
  on public.sadhana_reports
  for select
  to authenticated
  using (
    (profile_id = auth.uid() and private.is_active_profile(auth.uid()))
    or private.is_mentor_of(profile_id)
    or private.is_super_admin()
  );

drop policy if exists sadhana_reports_insert on public.sadhana_reports;
create policy sadhana_reports_insert
  on public.sadhana_reports
  for insert
  to authenticated
  with check (
    profile_id = auth.uid()
    and private.is_active_profile(auth.uid())
  );

drop policy if exists sadhana_reports_update on public.sadhana_reports;
create policy sadhana_reports_update
  on public.sadhana_reports
  for update
  to authenticated
  using (
    profile_id = auth.uid()
    and private.is_active_profile(auth.uid())
  )
  with check (
    profile_id = auth.uid()
    and private.is_active_profile(auth.uid())
  );

-- No time-window restriction on edits (approved decision): a devotee may
-- edit their own submitted report indefinitely. No mentor/admin override on
-- UPDATE either — report content should only ever reflect what the devotee
-- themself submitted.

drop policy if exists sadhana_reports_delete on public.sadhana_reports;
create policy sadhana_reports_delete
  on public.sadhana_reports
  for delete
  to authenticated
  using (private.is_super_admin());

-- ---- notifications ------------------------------------------------------

drop policy if exists notifications_select on public.notifications;
create policy notifications_select
  on public.notifications
  for select
  to authenticated
  using (
    (recipient_id = auth.uid() and private.is_active_profile(auth.uid()))
    or private.is_super_admin()
  );

-- No INSERT policy: notifications are fanned out by system/service-role
-- code (which bypasses RLS entirely), never inserted directly by a client —
-- a devotee or mentor must not be able to fabricate their own notifications.

drop policy if exists notifications_update on public.notifications;
create policy notifications_update
  on public.notifications
  for update
  to authenticated
  using (
    recipient_id = auth.uid()
    and private.is_active_profile(auth.uid())
  )
  with check (
    recipient_id = auth.uid()
    and private.is_active_profile(auth.uid())
  );

drop policy if exists notifications_delete on public.notifications;
create policy notifications_delete
  on public.notifications
  for delete
  to authenticated
  using (
    recipient_id = auth.uid()
    and private.is_active_profile(auth.uid())
  );

-- ---- announcements ------------------------------------------------------

drop policy if exists announcements_select on public.announcements;
create policy announcements_select
  on public.announcements
  for select
  to authenticated
  using (
    (
      is_published
      and private.is_active_profile(auth.uid())
      and (
        scope = 'all'
        or (
          scope = 'devotees'
          and exists (select 1 from public.profiles where id = auth.uid() and role = 'devotee')
        )
        or (
          scope = 'mentors'
          and exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
        )
        or (
          scope = 'temple_group'
          and temple_group_id is not distinct from (
            select temple_group_id from public.profiles where id = auth.uid()
          )
        )
      )
    )
    or (author_id = auth.uid() and private.is_active_profile(auth.uid()))
    or private.is_super_admin()
  );

drop policy if exists announcements_insert on public.announcements;
create policy announcements_insert
  on public.announcements
  for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and private.can_publish_announcement(scope, temple_group_id)
  );

drop policy if exists announcements_update on public.announcements;
create policy announcements_update
  on public.announcements
  for update
  to authenticated
  using (
    (author_id = auth.uid() and private.is_active_profile(auth.uid()))
    or private.is_super_admin()
  )
  with check (
    private.can_publish_announcement(scope, temple_group_id)
    or private.is_super_admin()
  );

drop policy if exists announcements_delete on public.announcements;
create policy announcements_delete
  on public.announcements
  for delete
  to authenticated
  using (
    (author_id = auth.uid() and private.is_active_profile(auth.uid()))
    or private.is_super_admin()
  );

-- ============================================================================
-- 19. Exact least-privilege table grants
--
-- Every operation granted here is matched by at least one RLS policy above
-- that can actually permit it for some authenticated user. Nothing is
-- granted "for convenience" where RLS would permanently deny it for
-- everyone: profiles has no DELETE grant (no DELETE policy exists for any
-- role), mentor_assignments has no DELETE grant (append-only, no DELETE
-- policy exists for any role), notifications has no INSERT grant
-- (system/service-role only), profiles has no INSERT grant (trigger-only).
-- ============================================================================

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.temple_groups to authenticated;
grant select, insert, update on public.mentor_assignments to authenticated;
grant select, insert, update, delete on public.sadhana_reports to authenticated;
grant select, update, delete on public.notifications to authenticated;
grant select, insert, update, delete on public.announcements to authenticated;

-- ============================================================================
-- 20. Function EXECUTE grants/revokes
--
-- The `private` schema is the actual boundary that keeps these functions off
-- the Data API surface (see section 3) — granting EXECUTE to `authenticated`
-- here is required for RLS policy evaluation to succeed (the invoking role
-- must hold EXECUTE on any function a policy calls, independent of
-- SECURITY DEFINER), and it does NOT make these functions callable through
-- PostgREST, because PostgREST never introspects the `private` schema.
--
-- Trigger functions (handle_new_user, set_updated_at,
-- protect_profile_restricted_columns, validate_mentor_assignment_roles) get
-- no EXECUTE grant to any client-facing role at all: Postgres invokes
-- trigger functions automatically as part of the triggering statement,
-- gated only by table-level DML privilege (section 19) — no explicit
-- EXECUTE grant is ever required or appropriate for them.
-- ============================================================================

revoke all on schema private from public;
grant usage on schema private to authenticated;

revoke execute on function private.is_super_admin() from public;
revoke execute on function private.is_active_profile(uuid) from public;
revoke execute on function private.is_mentor_of(uuid) from public;
revoke execute on function private.can_publish_announcement(text, uuid) from public;

grant execute on function private.is_super_admin() to authenticated;
grant execute on function private.is_active_profile(uuid) to authenticated;
grant execute on function private.is_mentor_of(uuid) to authenticated;
grant execute on function private.can_publish_announcement(text, uuid) to authenticated;

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.set_updated_at() from public;
revoke execute on function public.protect_profile_restricted_columns() from public;
revoke execute on function public.validate_mentor_assignment_roles() from public;

commit;
