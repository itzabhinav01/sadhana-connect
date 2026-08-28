-- ============================================================================
-- Sadhana Connect — 1-year Sadhana report retention sweep
--
-- Approved product decision: sadhana_reports rows older than 365 days are
-- eventually hard-deleted to bound table growth. Because there is no email
-- delivery in this app (in-app notifications only, no attachments), a
-- devotee cannot be guaranteed to have actually exported their data at the
-- exact moment it crosses the 1-year mark. The only safe way to honor
-- "export before delete" here is: flag it, warn the devotee with enough
-- lead time to act via the existing History screen's PDF/CSV export, and
-- only delete after a fixed grace period — this migration cannot confirm
-- the devotee actually exported, only that they were warned with time to.
--
-- Adds:
--   1. sadhana_reports.purge_scheduled_at — nullable, set once a report
--      first crosses the 1-year threshold, to (flag time + 30 days). Makes
--      the grace period explicit/auditable and handles retroactively-old
--      data fairly: a report that's already 3 years old on first run gets
--      the SAME 30-day grace period as one that just turned 1 year old,
--      counted from whenever this first runs — never deleted with zero
--      warning.
--   2. 'data_retention' — a new notifications.type value, so this
--      warning is distinguishable from the existing 'sadhana_reminder'
--      (Phase 20B) and doesn't inherit that type's different semantics
--      (2-per-24h rate limit, 3-consecutive-missed-day meaning).
--   3. private.flag_sadhana_reports_for_purge() — flag pass: sets
--      purge_scheduled_at on newly-eligible reports, one deduped
--      'data_retention' notification per affected devotee.
--   4. private.purge_old_sadhana_reports() — delete pass: hard-deletes
--      any report whose grace period has elapsed. mentor_comments and any
--      notifications.related_report_id pointing at a deleted report
--      cascade-delete automatically (existing ON DELETE CASCADE FKs from
--      0001/0004) — no extra cleanup needed here.
--   5. private.sweep_sadhana_report_retention() — wraps both passes in
--      call order (flag, then delete) so a report flagged in this same
--      run can never be caught by the delete pass in the same run (its
--      purge_scheduled_at is always now() + 30 days, never in the past).
--      Scheduled once daily via pg_cron, same established pattern as
--      0011/0012's cron jobs.
--   6. private.cleanup_old_notifications() (0012) is extended to also
--      clean up 'data_retention' notifications after 30 days — same
--      transient-notification lifetime as 'mentor_comment'/
--      'sadhana_reminder', for the same reason: by the time one is 30
--      days old, the reports it warned about have already been deleted
--      (30-day grace period), so it has nothing left to point a devotee
--      at.
--
-- No RLS changes: both new functions are SECURITY DEFINER, called only by
-- pg_cron (never client-reachable — neither is GRANTed to `authenticated`,
-- matching notify_missed_sadhana()/cleanup_old_notifications() (0012)),
-- and delete via a direct table operation the same way those existing
-- functions already write/delete under RLS's back.
--
-- THIS IS IRREVERSIBLE ONCE THE DELETE PASS RUNS. There is no soft-delete,
-- undo, or trash for a purged sadhana_reports row.
--
-- Replay safety: `create or replace function` (idempotent) throughout;
-- the cron job is (re)scheduled via the same existence-checked
-- cron.unschedule() + cron.schedule() pattern established in 0011/0012.
-- ============================================================================

begin;

-- ============================================================================
-- 1. purge_scheduled_at column + partial index
--
-- Partial (WHERE purge_scheduled_at IS NOT NULL) since the overwhelming
-- majority of rows will always be NULL (not yet 1 year old) — keeps the
-- index small and exactly matches the delete pass's own WHERE clause.
-- ============================================================================

alter table public.sadhana_reports
  add column if not exists purge_scheduled_at timestamptz;

create index if not exists sadhana_reports_purge_scheduled_at_idx
  on public.sadhana_reports (purge_scheduled_at)
  where purge_scheduled_at is not null;

-- ============================================================================
-- 2. 'data_retention' notification type
-- ============================================================================

alter table public.notifications drop constraint if exists notifications_type_valid;
alter table public.notifications add constraint notifications_type_valid check (
  type in ('sadhana_reminder', 'mentor_comment', 'announcement', 'system', 'data_retention')
);

-- ============================================================================
-- 3. flag_sadhana_reports_for_purge() — flag pass
--
-- v_purge_at is computed once and reused for both the UPDATE and the
-- notification SELECT, so "reports just flagged in this run" can be
-- identified exactly (purge_scheduled_at = v_purge_at) without a second
-- timestamp column or a temp table.
--
-- Dedup: skipped per-devotee if a 'data_retention' notification already
-- exists within the last 30 days — the same rolling-window technique as
-- notify_missed_sadhana() (0012), so a devotee with a live grace period
-- already running isn't re-notified every day until it lapses.
-- ============================================================================

create or replace function private.flag_sadhana_reports_for_purge()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purge_at timestamptz := now() + interval '30 days';
begin
  update public.sadhana_reports
  set purge_scheduled_at = v_purge_at
  where report_date < (current_date - 365)
    and purge_scheduled_at is null;

  insert into public.notifications (recipient_id, type, title, body)
  select distinct
    sr.profile_id,
    'data_retention',
    'Old Sadhana reports will be removed soon',
    'Some of your Sadhana reports are over a year old and will be permanently removed on '
      || to_char(v_purge_at, 'DD Mon YYYY')
      || '. Export them from History before then if you want to keep a copy.'
  from public.sadhana_reports sr
  where sr.purge_scheduled_at = v_purge_at
    and not exists (
      select 1 from public.notifications n
      where n.recipient_id = sr.profile_id
        and n.type = 'data_retention'
        and n.created_at >= now() - interval '30 days'
    );
end;
$$;

revoke execute on function private.flag_sadhana_reports_for_purge() from public;

-- ============================================================================
-- 4. purge_old_sadhana_reports() — delete pass
-- ============================================================================

create or replace function private.purge_old_sadhana_reports()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.sadhana_reports
  where purge_scheduled_at is not null
    and purge_scheduled_at <= now();
$$;

revoke execute on function private.purge_old_sadhana_reports() from public;

-- ============================================================================
-- 5. sweep_sadhana_report_retention() — daily entry point, flag then delete
-- ============================================================================

create or replace function private.sweep_sadhana_report_retention()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform private.flag_sadhana_reports_for_purge();
  perform private.purge_old_sadhana_reports();
end;
$$;

revoke execute on function private.sweep_sadhana_report_retention() from public;

-- ============================================================================
-- 6. cleanup_old_notifications() (0012) — extended to include
--    'data_retention'
-- ============================================================================

create or replace function private.cleanup_old_notifications()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.notifications
  where type in ('mentor_comment', 'sadhana_reminder', 'data_retention')
    and created_at <= now() - interval '30 days';
$$;

-- ============================================================================
-- 7. Scheduled job
-- ============================================================================

do $$
begin
  if exists (select 1 from cron.job where jobname = 'sadhana-report-retention-sweep') then
    perform cron.unschedule('sadhana-report-retention-sweep');
  end if;
end;
$$;

select cron.schedule(
  'sadhana-report-retention-sweep',
  '30 6 * * *',
  $$select private.sweep_sadhana_report_retention();$$
);

commit;
