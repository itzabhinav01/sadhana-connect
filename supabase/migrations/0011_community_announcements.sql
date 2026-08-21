-- ============================================================================
-- Sadhana Connect — Phase 20A: Community Announcements Enhancement
--
-- Upgrades the existing Phase 13 announcements system (public.announcements,
-- unchanged table identity, no drop/recreate) with:
--   1. expires_at — nullable hard-deletion deadline (NULL = permanent)
--   2. is_pinned — unlimited pinning for v1 (see note below)
--   3. public.announcement_comments — flat, non-nested devotee Q&A
--   4. An hourly pg_cron job that hard-deletes expired announcements
--
-- Reuses EXISTING infrastructure throughout — no new notification table,
-- no new notification mechanism, no new scope values, no new role, no
-- archival/soft-delete table:
--   * notifications.related_announcement_id already ON DELETE CASCADE
--     (0001) — deleting an announcement (manually or via cron) already
--     cascades its notifications with zero changes here.
--   * notify_on_announcement_published() (0007) already fires only on the
--     unpublished->published transition and only targets role='devotee'
--     rows — a mentor/admin creator can never match that WHERE clause, so
--     "don't notify the creator" already holds and is NOT touched here.
--   * private.can_publish_announcement(), announcements_insert, and the
--     Finding-1 author-spoofing fix (0009) are all UNCHANGED — a mentor
--     still cannot author outside their own temple group or reassign
--     author_id.
--
-- ----------------------------------------------------------------------
-- Pinning — approved v1 decision
--
-- A hard "max 3 pinned per audience" rule needs a COUNT-based trigger
-- (a partial unique index only enforces max-1, not max-N), which is
-- unjustified complexity for a cosmetic ordering hint. v1 ships
-- unlimited is_pinned; the Mentor/Admin UI treats 3 as a soft guideline,
-- not a DB-enforced ceiling.
--
-- ----------------------------------------------------------------------
-- Replay safety (approved requirement)
--
-- Every statement in this migration is safe to run more than once against
-- the same database and converges to the same end state:
--   * `create extension if not exists`
--   * `alter table ... add column` is guarded with a DO block checking
--     information_schema first (no native IF NOT EXISTS for ADD COLUMN
--     on this Postgres version's syntax used elsewhere in this codebase)
--   * `create or replace function`
--   * `create or replace trigger`
--   * `drop policy if exists` + `create policy`
--   * `drop index if exists` + `create index if not exists`
--   * the cron job is conditionally unscheduled by name (existence
--     checked first, since cron.unschedule() errors on a missing job and
--     the migration role has no direct DELETE on cron.job — see section 6)
--     before being (re)scheduled, so replaying this migration never
--     produces two jobs named 'cleanup-expired-announcements'
-- ============================================================================

begin;

-- ============================================================================
-- 1. announcements — new columns
-- ============================================================================

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'announcements' and column_name = 'expires_at'
  ) then
    alter table public.announcements add column expires_at timestamptz;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'announcements' and column_name = 'is_pinned'
  ) then
    alter table public.announcements add column is_pinned boolean not null default false;
  end if;
end;
$$;

-- ============================================================================
-- 2. announcements — index changes
--
-- announcements_published_feed_idx (is_published, published_at desc) is
-- superseded by a pin-aware composite covering the exact feed query shape
-- (section 7's required ordering: pinned first, then published_at desc).
-- announcements_expires_at_idx is a partial index (only rows with a
-- deadline) supporting both the cron cleanup's WHERE clause and the
-- announcements_select expiry guard below.
-- ============================================================================

drop index if exists public.announcements_published_feed_idx;

create index if not exists announcements_feed_ordering_idx
  on public.announcements (is_published, is_pinned desc, published_at desc);

create index if not exists announcements_expires_at_idx
  on public.announcements (expires_at)
  where expires_at is not null;

-- ============================================================================
-- 3. announcement_comments
--
-- Mirrors sadhana_report_comments (0004) exactly in shape: snapshot
-- author name (no live join — same rationale as mentor_name there),
-- hard delete, flat (no parent_comment_id, no nested threads by design).
-- author_id -> profiles.id is ON DELETE RESTRICT, matching every other
-- authored-content FK in this schema (mentor_id, profile_id) — comment
-- history is not silently dropped by a profile deletion (which does not
-- exist as a hard-delete path anyway; see profiles' own RESTRICT note).
-- ============================================================================

create table if not exists public.announcement_comments (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcements (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete restrict,
  author_name text not null,
  comment_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint announcement_comments_text_not_blank check (char_length(trim(comment_text)) > 0),
  constraint announcement_comments_text_max_length check (char_length(comment_text) <= 2000),
  constraint announcement_comments_author_name_not_blank check (char_length(trim(author_name)) > 0)
);

-- The only query shape this feature needs: "this announcement's comments,
-- in order." Matches sadhana_report_comments_report_idx's own reasoning.
create index if not exists announcement_comments_announcement_idx
  on public.announcement_comments (announcement_id, created_at);

create or replace trigger trg_announcement_comments_set_updated_at
  before update on public.announcement_comments
  for each row execute function public.set_updated_at();

alter table public.announcement_comments enable row level security;

-- ============================================================================
-- 4. announcement_comments — RLS policies
--
-- SELECT is deliberately a plain (non-SECURITY-DEFINER) EXISTS against
-- public.announcements: because this policy body runs as the invoking
-- role (not a function owner), that inner query is itself subject to
-- announcements_select's own RLS — visibility is inherited for free, with
-- zero duplicated scope logic. The same reasoning applies to the mentor/
-- devotee branches of INSERT and the mentor-moderation branch of DELETE
-- below.
-- ============================================================================

-- SELECT: visible wherever the parent announcement is visible — a
-- devotee/mentor/admin who can read the announcement can read its Q&A.
drop policy if exists announcement_comments_select on public.announcement_comments;
create policy announcement_comments_select
  on public.announcement_comments
  for select
  to authenticated
  using (
    exists (
      select 1 from public.announcements a
      where a.id = announcement_comments.announcement_id
    )
  );

-- INSERT:
--   * super_admin: unconditional (existing admin authorization is
--     blanket, per announcements_select/_update's own is_super_admin()
--     branches).
--   * mentor: only on an announcement THEY authored — "announcements they
--     are authorized to manage", the same author_id = auth.uid() bar
--     announcements_update/_delete already hold mentors to. A mentor
--     reading (but not authoring) another party's visible announcement
--     cannot post into it.
--   * everyone else (devotee, or any active profile that is not a
--     mentor): any announcement visible to them, per section 9 ("a
--     genuine question on an announcement they can see").
drop policy if exists announcement_comments_insert on public.announcement_comments;
create policy announcement_comments_insert
  on public.announcement_comments
  for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and private.is_active_profile(auth.uid())
    and (
      private.is_super_admin()
      or (
        exists (
          select 1 from public.profiles
          where id = auth.uid() and role = 'mentor' and is_active
        )
        and exists (
          select 1 from public.announcements a
          where a.id = announcement_comments.announcement_id
            and a.author_id = auth.uid()
        )
      )
      or (
        not exists (
          select 1 from public.profiles
          where id = auth.uid() and role = 'mentor'
        )
        and exists (
          select 1 from public.announcements a
          where a.id = announcement_comments.announcement_id
        )
      )
    )
  );

-- UPDATE: own comment only, for every role — editing someone else's
-- exact wording was never requested, only moderation (DELETE) was.
drop policy if exists announcement_comments_update on public.announcement_comments;
create policy announcement_comments_update
  on public.announcement_comments
  for update
  to authenticated
  using (author_id = auth.uid() and private.is_active_profile(auth.uid()))
  with check (author_id = auth.uid() and private.is_active_profile(auth.uid()));

-- DELETE (hard delete, moderation):
--   * own comment (any role) — "edit/delete own comment/replies".
--   * the announcement's own author (a mentor moderating their own
--     announcement's thread) — "moderate/delete comments in
--     announcements they manage".
--   * super_admin — "manage/moderate comments globally".
drop policy if exists announcement_comments_delete on public.announcement_comments;
create policy announcement_comments_delete
  on public.announcement_comments
  for delete
  to authenticated
  using (
    (author_id = auth.uid() and private.is_active_profile(auth.uid()))
    or private.is_super_admin()
    or exists (
      select 1 from public.announcements a
      where a.id = announcement_comments.announcement_id
        and a.author_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.announcement_comments to authenticated;

-- ============================================================================
-- 5. announcements_select — expiry guard
--
-- Adds exactly one condition to the general scope-matching branch (the
-- one used by devotees/mentors reading OTHER people's announcements):
-- expired-but-not-yet-purged rows (the <=1hr window before the hourly
-- cron below runs) are excluded from that feed-style branch. The
-- author's-own-row branch and the is_super_admin() branch are
-- deliberately left unfiltered by expiry, so an author/admin still sees
-- their own near-expiry items for management (the "Expires" UI column in
-- section 17 needs this). Every other condition in this policy is
-- byte-for-byte identical to 0001's original — nothing else about
-- publication/security semantics changes here (approved: "unless
-- necessary for this feature").
-- ============================================================================

drop policy if exists announcements_select on public.announcements;
create policy announcements_select
  on public.announcements
  for select
  to authenticated
  using (
    (
      is_published
      and private.is_active_profile(auth.uid())
      and (expires_at is null or expires_at > now())
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

-- ============================================================================
-- 6. Scheduled cleanup — pg_cron
--
-- private.cleanup_expired_announcements() is deliberately in the
-- `private` schema (never PostgREST-exposed, same as every other helper
-- in this schema) — it is invoked only by the cron job below and,
-- manually, by a trusted operator for verification. SECURITY DEFINER so
-- it works regardless of which role owns the cron job on a given
-- environment; search_path pinned per this schema's established pattern.
--
-- The DELETE is exactly the equivalent specified: unconditional on
-- is_published — a draft with an expiry date is purged too, matching the
-- literal approved spec.
-- ============================================================================

create extension if not exists pg_cron with schema extensions;

create or replace function private.cleanup_expired_announcements()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.announcements
  where expires_at is not null
    and expires_at <= now();
$$;

revoke execute on function private.cleanup_expired_announcements() from public;

-- Idempotent (re)scheduling: unschedule any existing job with this exact
-- name first, then schedule exactly one. On Supabase, cron.job is owned
-- by an internal role — the migration role has SELECT on it and EXECUTE
-- on cron.unschedule()/cron.schedule() (both confirmed live against this
-- project), but NOT direct DELETE/UPDATE table privileges on cron.job
-- itself. cron.unschedule(job_name) also raises an error if no job with
-- that name exists, so the existence check below (permitted SELECT) is
-- required to make this safe to run when no prior job is present, not
-- just when one already exists. Replaying this migration can therefore
-- never produce duplicate jobs.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'cleanup-expired-announcements') then
    perform cron.unschedule('cleanup-expired-announcements');
  end if;
end;
$$;

select cron.schedule(
  'cleanup-expired-announcements',
  '7 * * * *',
  $$select private.cleanup_expired_announcements();$$
);

commit;
