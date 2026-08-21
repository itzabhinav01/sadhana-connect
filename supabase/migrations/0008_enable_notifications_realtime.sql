-- ============================================================================
-- Sadhana Connect — Phase 17 v1 follow-up: enable Realtime on notifications
--
-- Fixes the one confirmed gap from Phase 17's live verification: the
-- application's postgres_changes subscription (useNotificationsRealtime,
-- src/application/notifications/use-notifications-realtime.ts) was correct
-- and RLS-authorized, but nothing was ever broadcast, because
-- public.notifications was never added to the supabase_realtime
-- publication. Confirmed live via `select * from pg_publication_tables
-- where tablename = 'notifications'` returning zero rows before this
-- migration.
--
-- This migration does exactly one thing: add public.notifications to the
-- existing supabase_realtime publication. It does not touch the table's
-- columns, RLS policies, or grants (all already correct and already
-- live-verified — 0007's producers and this table's RLS are unmodified),
-- and it does not touch 0007 itself.
--
-- Idempotent: ALTER PUBLICATION ... ADD TABLE raises an error if the
-- table is already a publication member (unlike CREATE ... IF NOT EXISTS
-- statements elsewhere in this schema, ALTER PUBLICATION has no built-in
-- IF NOT EXISTS form), so the add is guarded by an explicit existence
-- check against pg_publication_tables — replaying this migration is a
-- no-op, never an error.
-- ============================================================================

begin;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end
$$;

commit;
