-- ============================================================================
-- Sadhana Connect — Phase 13: Mentor comments on Sadhana reports
--
-- sadhana_report_comments — a mentor's notes attached to a specific
-- devotee's specific report. Authorization is derived entirely from the
-- EXISTING mentor-assignment model (private.is_mentor_of,
-- private.is_active_profile) via the report's own profile_id — no new
-- authorization helper is created, and no existing RLS policy on any
-- other table is modified.
--
-- Visibility model (approved Phase 13 decisions):
--   * A mentor's access is gated by CURRENT private.is_mentor_of(), not by
--     who authored a given comment. A mentor who is reassigned away from
--     a devotee loses access to every comment on that devotee's reports,
--     including their own — there is no author-based carve-out. A newly
--     assigned mentor inherits the full existing comment history for
--     continuity of care.
--   * A devotee can always read comments on their own reports while their
--     own account is active (mirrors sadhana_reports_select's own-row
--     branch exactly) — never write, edit, or delete.
--   * A disabled devotee becomes inaccessible via the same
--     private.is_mentor_of()/is_active_profile() gates already governing
--     profiles and sadhana_reports — not a new rule.
--
-- mentor_name is a point-in-time snapshot of the authoring mentor's
-- full_name, captured at write time by the application layer — not a
-- live join to profiles. This is deliberate: a devotee currently has no
-- RLS path to read their mentor's profile row at all (profiles_select's
-- is_mentor_of() branch is one-directional, mentor -> devotee only), and
-- this migration does not add one. Widening profiles_select is a
-- separate, foundational change explicitly out of scope here. The
-- snapshot pattern already has precedent in this schema
-- (sadhana_reports.signature_text).
-- ============================================================================

begin;

-- ============================================================================
-- 1. sadhana_report_comments
-- ============================================================================

create table if not exists public.sadhana_report_comments (
  id uuid primary key default gen_random_uuid(),
  sadhana_report_id uuid not null references public.sadhana_reports (id) on delete cascade,
  mentor_id uuid not null references public.profiles (id) on delete restrict,
  mentor_name text not null,
  comment_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sadhana_report_comments_text_not_blank check (char_length(trim(comment_text)) > 0),
  constraint sadhana_report_comments_text_max_length check (char_length(comment_text) <= 2000),
  constraint sadhana_report_comments_mentor_name_not_blank check (char_length(trim(mentor_name)) > 0)
);

-- The only query shape this phase needs: "this report's comments, in
-- order." No index on mentor_id — nothing in this phase queries "all
-- comments a given mentor has written."
create index if not exists sadhana_report_comments_report_idx
  on public.sadhana_report_comments (sadhana_report_id, created_at);

-- ============================================================================
-- 2. updated_at trigger
--
-- Reuses public.set_updated_at(), already defined in 0001_initial_schema.
-- ============================================================================

create or replace trigger trg_sadhana_report_comments_set_updated_at
  before update on public.sadhana_report_comments
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 3. RLS enablement
-- ============================================================================

alter table public.sadhana_report_comments enable row level security;

-- ============================================================================
-- 4. RLS policies
--
-- Every authorization check below routes through a subquery joining to
-- sadhana_reports (to recover the devotee's profile_id) and then calls
-- private.is_mentor_of()/private.is_active_profile() — the exact same
-- functions that already govern profiles_select and
-- sadhana_reports_select. No new helper function is created.
-- ============================================================================

-- SELECT: the report's own devotee (while active), or the CURRENT active
-- mentor of that devotee, or a super admin.
drop policy if exists sadhana_report_comments_select on public.sadhana_report_comments;
create policy sadhana_report_comments_select
  on public.sadhana_report_comments
  for select
  to authenticated
  using (
    exists (
      select 1 from public.sadhana_reports sr
      where sr.id = sadhana_report_comments.sadhana_report_id
        and (
          (sr.profile_id = auth.uid() and private.is_active_profile(auth.uid()))
          or private.is_mentor_of(sr.profile_id)
        )
    )
    or private.is_super_admin()
  );

-- INSERT: only the CURRENT active mentor of the report's devotee, and
-- only as themselves (mentor_id must equal the caller).
drop policy if exists sadhana_report_comments_insert on public.sadhana_report_comments;
create policy sadhana_report_comments_insert
  on public.sadhana_report_comments
  for insert
  to authenticated
  with check (
    mentor_id = auth.uid()
    and exists (
      select 1 from public.sadhana_reports sr
      where sr.id = sadhana_report_comments.sadhana_report_id
        and private.is_mentor_of(sr.profile_id)
    )
  );

-- UPDATE: only the comment's own author, and only while STILL the
-- currently assigned active mentor of that devotee — re-checked live on
-- every update, never assumed from INSERT time. A former mentor cannot
-- edit their own old comment after being reassigned away.
drop policy if exists sadhana_report_comments_update on public.sadhana_report_comments;
create policy sadhana_report_comments_update
  on public.sadhana_report_comments
  for update
  to authenticated
  using (
    mentor_id = auth.uid()
    and exists (
      select 1 from public.sadhana_reports sr
      where sr.id = sadhana_report_comments.sadhana_report_id
        and private.is_mentor_of(sr.profile_id)
    )
  )
  with check (
    mentor_id = auth.uid()
    and exists (
      select 1 from public.sadhana_reports sr
      where sr.id = sadhana_report_comments.sadhana_report_id
        and private.is_mentor_of(sr.profile_id)
    )
  );

-- DELETE (hard delete): same live re-check as UPDATE, or a super admin —
-- matching sadhana_reports' own super-admin pattern (SELECT + DELETE
-- oversight, never INSERT/UPDATE as someone else's authored content).
drop policy if exists sadhana_report_comments_delete on public.sadhana_report_comments;
create policy sadhana_report_comments_delete
  on public.sadhana_report_comments
  for delete
  to authenticated
  using (
    (
      mentor_id = auth.uid()
      and exists (
        select 1 from public.sadhana_reports sr
        where sr.id = sadhana_report_comments.sadhana_report_id
          and private.is_mentor_of(sr.profile_id)
      )
    )
    or private.is_super_admin()
  );

-- ============================================================================
-- 5. Exact least-privilege table grant
--
-- Full CRUD granted at the table level; RLS narrows per-row and
-- per-operation above — same pattern as sadhana_reports' own grant.
-- ============================================================================

grant select, insert, update, delete on public.sadhana_report_comments to authenticated;

commit;
