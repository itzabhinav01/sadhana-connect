-- ============================================================================
-- Sadhana Connect — Phase 19 remediation round 1: announcement hardening
--
-- Fixes two MEDIUM findings from the Phase 19 read-only security audit,
-- both scoped to public.announcements only. Nothing else in the schema
-- (RLS elsewhere, SECURITY DEFINER functions, triggers, grants) is
-- touched.
--
-- ----------------------------------------------------------------------
-- Finding 1 — announcement authorship spoofing
--
-- announcements_update's WITH CHECK never re-verified author_id, only
-- can_publish_announcement(scope, temple_group_id). A mentor who owns an
-- announcement (passes USING) could, in the same UPDATE, set author_id
-- to any other profile's UUID, as long as scope/temple_group_id still
-- satisfied can_publish_announcement() for themselves — an authorship-
-- integrity gap, not a new read-access escalation.
--
-- Fix: the non-admin branch of WITH CHECK now also requires
-- `author_id = auth.uid()`, so a mentor's own UPDATE can never reassign
-- authorship away from themselves. The super_admin branch
-- (`or private.is_super_admin()`) is unchanged — admins retain full
-- existing update capability, including reassigning author_id if ever
-- needed administratively.
--
-- ----------------------------------------------------------------------
-- Finding 2 — announcement content amplification
--
-- announcements.title/content had only "not blank" checks, no maximum.
-- notify_on_announcement_published() (0007) copies both, in full and
-- untruncated, into every fanned-out notifications row at publish time
-- — an unbounded title/content is amplified once per matching devotee
-- recipient in a single INSERT ... SELECT.
--
-- Fix: explicit CHECK constraints matching the limits already enforced
-- client-side in src/application/announcements/announcement-schema.ts
-- (ANNOUNCEMENT_TITLE_MAX_LENGTH = 200, ANNOUNCEMENT_CONTENT_MAX_LENGTH
-- = 5000) — generous for a devotional announcement headline/body, while
-- keeping the fan-out amplification bounded. This is the authoritative
-- layer; the Zod bound is a friendly-UX mirror of it, not a substitute
-- for it (a direct API/RPC insert bypassing the frontend is still
-- caught here).
-- ============================================================================

begin;

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
    (
      author_id = auth.uid()
      and private.can_publish_announcement(scope, temple_group_id)
    )
    or private.is_super_admin()
  );

alter table public.announcements
  add constraint announcements_title_max_length check (char_length(title) <= 200),
  add constraint announcements_content_max_length check (char_length(content) <= 5000);

commit;
