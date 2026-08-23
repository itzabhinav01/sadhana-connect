-- ============================================================================
-- Sadhana Connect — Phase 20B: Devotee Oversight + Sadhana Reminders
--
-- Adds, on top of the existing schema (no drop/recreate of anything):
--   1. public.send_reminder_notification() — a mentor (own devotees only)
--      or super_admin (any devotee) can manually send a 'sadhana_reminder'
--      notification, generic or custom text, rate-limited to 2 per
--      devotee per rolling 24h.
--   2. private.notify_missed_sadhana() — a daily pg_cron job that fires
--      one 'sadhana_reminder' notification per devotee whose 3 most
--      recently completed calendar days all have zero sadhana_reports
--      rows, deduped against a reminder already sent in that window.
--   3. private.cleanup_old_notifications() — a daily pg_cron job that
--      hard-deletes 'mentor_comment' and 'sadhana_reminder' notifications
--      older than 30 days. 'announcement' notifications are deliberately
--      EXCLUDED — they already cascade-delete with their parent
--      announcement (0001's own ON DELETE CASCADE), which is governed by
--      that announcement's own expires_at (0011), not a fixed age.
--
-- Reuses EXISTING infrastructure throughout:
--   * 'sadhana_reminder' is already a valid value in
--     notifications_type_valid (0001) — reserved since Phase 17, never
--     had a producer until now.
--   * private.is_mentor_of() / private.is_super_admin() /
--     private.is_active_profile() are the exact same authorization
--     helpers already governing every other mentor/admin-facing RLS
--     policy and function in this schema — no new helper is introduced.
--   * No RLS policy on public.notifications changes at all: it still has
--     no INSERT policy/grant for `authenticated` (0001's own "a devotee
--     or mentor must not be able to fabricate their own notifications").
--     Both new producers are SECURITY DEFINER, exactly like
--     notify_on_mentor_comment()/notify_on_announcement_published()
--     (0007) — this migration does not weaken that boundary, it uses the
--     same established bypass for a legitimate system-generated insert.
--   * public.send_reminder_notification() is SECURITY INVOKER-style
--     authorization (an explicit private.is_mentor_of()/is_super_admin()
--     check at the top, exactly like public.reassign_devotee(), 0005)
--     layered under a SECURITY DEFINER body — the check is what actually
--     gates who may call this successfully; DEFINER is only what makes
--     the resulting INSERT possible at all, same reasoning as the two
--     trigger producers.
--
-- ----------------------------------------------------------------------
-- Replay safety
--
-- `create or replace function` (idempotent), and both cron jobs are
-- (re)scheduled via the same existence-checked cron.unschedule() +
-- cron.schedule() pattern established in 0011 (the migration role has no
-- direct DELETE on cron.job on this platform — see 0011's own note).
-- ============================================================================

begin;

-- ============================================================================
-- 1. send_reminder_notification() — manual reminder
--
-- Devotee is confirmed still role='devotee' AND is_active before
-- inserting — mirrors the same defensive check pattern already used in
-- validate_mentor_assignment_roles() (0001), just read-checked here
-- instead of enforced via a FK-adjacent trigger, since this is a plain
-- function, not a trigger on the notifications table itself.
--
-- Rate limit (approved: max 2 per devotee per rolling 24h) is checked
-- with a live COUNT immediately before the INSERT, inside the same
-- SECURITY DEFINER call — this is the only place a mentor caller COULD
-- enforce it at all, since a mentor has no RLS read access whatsoever to
-- another profile's notifications rows (notifications_select is
-- recipient_id = auth.uid() OR is_super_admin() only) — there is no
-- client-side precheck path available the way the mentor-role-change
-- gate uses one, so this function is the sole enforcement point, not a
-- second layer over an app-level check.
--
-- p_message is trimmed and truncated defensively (500 chars) — the
-- application's own Zod schema mirrors this bound as UX, same
-- relationship as every other content-length pair in this schema.
-- ============================================================================

create or replace function public.send_reminder_notification(
  p_devotee_id uuid,
  p_message text default null
)
returns public.notifications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_devotee_role public.app_role;
  v_devotee_active boolean;
  v_recent_count integer;
  v_result public.notifications;
begin
  if not (private.is_mentor_of(p_devotee_id) or private.is_super_admin()) then
    raise exception 'Not authorized to send a reminder to this devotee.'
      using errcode = '42501';
  end if;

  select role, is_active into v_devotee_role, v_devotee_active
  from public.profiles
  where id = p_devotee_id;

  if v_devotee_role is distinct from 'devotee' or not coalesce(v_devotee_active, false) then
    raise exception 'This devotee is not available to receive a reminder.'
      using errcode = '22023';
  end if;

  select count(*) into v_recent_count
  from public.notifications
  where recipient_id = p_devotee_id
    and type = 'sadhana_reminder'
    and created_at >= now() - interval '24 hours';

  if v_recent_count >= 2 then
    raise exception 'RATE_LIMITED: This devotee has already been reminded twice in the last 24 hours.'
      using errcode = 'P0001';
  end if;

  insert into public.notifications (recipient_id, type, title, body)
  values (
    p_devotee_id,
    'sadhana_reminder',
    'Reminder to fill your Sadhana',
    coalesce(nullif(left(trim(p_message), 500), ''), 'Please remember to fill in your Sadhana report.')
  )
  returning * into v_result;

  return v_result;
end;
$$;

revoke execute on function public.send_reminder_notification(uuid, text) from public;
grant execute on function public.send_reminder_notification(uuid, text) to authenticated;

-- ============================================================================
-- 2. notify_missed_sadhana() — automatic 3-consecutive-missed-day check
--
-- "Missed day" = zero sadhana_reports rows for that calendar date
-- (approved: no weekend/holiday exclusion). The 3-day window is the 3
-- most recently COMPLETED calendar days (today never counts — it isn't
-- over yet). A single set-based INSERT ... SELECT, never a per-devotee
-- loop, matching notify_on_announcement_published's own stated reasoning
-- (0007) for why this scales the same at 5 devotees or 5,000.
--
-- The devotee only qualifies if NO report exists ANYWHERE in the 3-day
-- window — equivalent to "all 3 are missing" for exactly a 3-day window
-- (if even one of the 3 days had a report, that day's row would satisfy
-- the EXISTS and exclude them, correctly).
--
-- Dedup: skipped if a sadhana_reminder notification (manual or
-- automatic — no distinction needed) already exists for this devotee
-- within the same 3-day window, so an ongoing multi-week missed streak
-- gets reminded roughly every 3 days, not once per day.
-- ============================================================================

create or replace function private.notify_missed_sadhana()
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.notifications (recipient_id, type, title, body)
  select
    p.id,
    'sadhana_reminder',
    'Missed Sadhana reminder',
    'You have not filled your Sadhana for the last 3 days. Please catch up when you can.'
  from public.profiles p
  where p.role = 'devotee'
    and p.is_active
    and not exists (
      select 1 from public.sadhana_reports sr
      where sr.profile_id = p.id
        and sr.report_date >= (current_date - 3)
        and sr.report_date <= (current_date - 1)
    )
    and not exists (
      select 1 from public.notifications n
      where n.recipient_id = p.id
        and n.type = 'sadhana_reminder'
        and n.created_at >= now() - interval '3 days'
    );
$$;

revoke execute on function private.notify_missed_sadhana() from public;

-- ============================================================================
-- 3. cleanup_old_notifications() — 30-day retention for non-announcement
--    notifications
-- ============================================================================

create or replace function private.cleanup_old_notifications()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.notifications
  where type in ('mentor_comment', 'sadhana_reminder')
    and created_at <= now() - interval '30 days';
$$;

revoke execute on function private.cleanup_old_notifications() from public;

-- ============================================================================
-- 4. Scheduled jobs — idempotent (re)scheduling, same pattern as 0011
-- ============================================================================

do $$
begin
  if exists (select 1 from cron.job where jobname = 'check-missed-sadhana') then
    perform cron.unschedule('check-missed-sadhana');
  end if;
end;
$$;

select cron.schedule(
  'check-missed-sadhana',
  '15 6 * * *',
  $$select private.notify_missed_sadhana();$$
);

do $$
begin
  if exists (select 1 from cron.job where jobname = 'cleanup-old-notifications') then
    perform cron.unschedule('cleanup-old-notifications');
  end if;
end;
$$;

select cron.schedule(
  'cleanup-old-notifications',
  '20 6 * * *',
  $$select private.cleanup_old_notifications();$$
);

commit;
