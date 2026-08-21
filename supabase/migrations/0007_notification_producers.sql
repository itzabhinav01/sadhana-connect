-- ============================================================================
-- Sadhana Connect — Phase 17 v1: notification producers
--
-- public.notifications and its RLS/grants already exist (0001_initial_schema)
-- and are NOT modified here — this migration adds only the two server-side
-- producers required for Phase 17 v1: 'mentor_comment' and 'announcement'.
-- 'sadhana_reminder' and 'system' remain defined in the existing
-- notifications_type_valid CHECK constraint but get no producer yet
-- (deferred — timing/timezone behavior not yet specified).
--
-- Why triggers, not an Edge Function or application-layer INSERT: both
-- source events (a mentor's comment, an announcement being published) are
-- already created directly by an `authenticated` client under RLS
-- (sadhana_report_comments_insert, announcements_insert/update) — there is
-- no service-role hop in that path today, and notifications has
-- deliberately no INSERT policy/grant for `authenticated` (0001's own
-- comment: "a devotee or mentor must not be able to fabricate their own
-- notifications"). A trigger is the smallest mechanism that can write into
-- a table the acting client has no grant on, atomically with the write
-- that causes it. This is the exact same shape already audited in this
-- schema for public.handle_new_user() (a SECURITY DEFINER trigger on
-- auth.users writing into public.profiles, a table `authenticated` also
-- cannot INSERT into directly) — no new pattern is introduced.
--
-- Both functions are SECURITY DEFINER with search_path pinned to `public`
-- (required to bypass RLS for the notifications INSERT the acting client
-- has no grant for) but are narrowly scoped to exactly that one INSERT —
-- neither accepts nor trusts any client-supplied recipient. The
-- mentor-comment function derives its recipient from the triggering
-- row's own sadhana_report_id via a server-side lookup against
-- sadhana_reports.profile_id; the announcement function derives its
-- recipients from a server-side scope match against public.profiles.
--
-- Neither function is reachable via PostgREST RPC, even though Postgres
-- grants EXECUTE on a new function to PUBLIC by default and neither
-- grant is explicitly revoked here (unlike the private.* RLS-helper
-- functions elsewhere in this schema, which revoke it because they
-- genuinely are plain callable functions). The actual protection here is
-- structural, not grant-based: both are declared `returns trigger`, and
-- Postgres refuses to execute a trigger function except as a trigger —
-- calling either via rpc/<function_name> raises "trigger functions can
-- only be called as triggers" before any of this function's own logic
-- ever runs, regardless of the caller's role or grants.
-- ============================================================================

begin;

-- ============================================================================
-- 1. Mentor-comment notification
--
-- One notification per comment, always, for the report's own devotee.
-- Fires after sadhana_report_comments_insert (RLS) has already verified
-- the acting mentor is the report's current active mentor — this trigger
-- does no authorization of its own, only recipient derivation.
--
-- sadhana_report_comments.sadhana_report_id is NOT NULL and FK-enforced
-- (on delete cascade) against sadhana_reports.id, so the SELECT below
-- always resolves for a row that just passed that FK check; the IF guard
-- is defensive only, so a future schema change can never cause a NULL
-- recipient_id to abort a devotee's comment thread with a constraint
-- violation on notifications instead of failing safely (silently
-- skipping the notification, never the comment itself).
-- ============================================================================

create or replace function public.notify_on_mentor_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient_id uuid;
begin
  select profile_id into v_recipient_id
  from public.sadhana_reports
  where id = new.sadhana_report_id;

  if v_recipient_id is not null then
    insert into public.notifications
      (recipient_id, type, title, body, related_report_id, related_announcement_id)
    values (
      v_recipient_id,
      'mentor_comment',
      'New mentor comment',
      case
        when char_length(new.comment_text) > 200
          then left(new.comment_text, 200) || '…'
        else new.comment_text
      end,
      new.sadhana_report_id,
      null
    );
  end if;

  return new;
end;
$$;

create or replace trigger trg_notify_on_mentor_comment
  after insert on public.sadhana_report_comments
  for each row execute function public.notify_on_mentor_comment();

-- ============================================================================
-- 2. Announcement-published notification
--
-- Fires only on the false -> true publish transition (INSERT with
-- is_published already true, or UPDATE where it just became true) — never
-- on an ordinary edit to an already-published announcement. The WHEN
-- clause filters this at the trigger level, before the function body ever
-- runs, so an unrelated UPDATE (e.g. editing title/content post-publish)
-- does no work here at all.
--
-- Two separate triggers (INSERT, UPDATE), not one combined
-- "INSERT OR UPDATE ... WHEN" trigger: Postgres does not make OLD
-- available in a WHEN clause for INSERT events, so a single shared WHEN
-- referencing old.is_published would be unsafe for the INSERT case. Two
-- triggers, each with a WHEN clause referencing only what that event type
-- actually provides, is the standard/documented-safe way to express this.
--
-- Recipients: every active devotee whose scope matches, resolved with one
-- set-based INSERT ... SELECT — never a per-recipient loop, so this scales
-- the same whether it reaches 5 devotees or 5,000. scope='mentors' matches
-- none of the WHERE branches below, so it correctly notifies zero
-- devotees; that is the only handling it needs.
-- ============================================================================

create or replace function public.notify_on_announcement_published()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications
    (recipient_id, type, title, body, related_announcement_id, related_report_id)
  select
    p.id,
    'announcement',
    new.title,
    new.content,
    new.id,
    null
  from public.profiles p
  where p.role = 'devotee'
    and p.is_active
    and (
      new.scope = 'all'
      or new.scope = 'devotees'
      or (
        new.scope = 'temple_group'
        and p.temple_group_id is not distinct from new.temple_group_id
      )
    );

  return new;
end;
$$;

create or replace trigger trg_notify_on_announcement_insert
  after insert on public.announcements
  for each row
  when (new.is_published)
  execute function public.notify_on_announcement_published();

create or replace trigger trg_notify_on_announcement_update
  after update on public.announcements
  for each row
  when (new.is_published and not old.is_published)
  execute function public.notify_on_announcement_published();

commit;
