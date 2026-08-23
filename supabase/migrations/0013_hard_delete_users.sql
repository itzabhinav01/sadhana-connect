-- ============================================================================
-- Sadhana Connect — Phase 20C: True hard delete
--
-- Approved reversal of the Phase 5/14 anonymize-and-preserve design: a
-- Super Admin deleting a user now permanently removes that profile row
-- AND every row that depended on it — sadhana reports, mentor-assignment
-- history (on either side), comments they wrote — plus the underlying
-- Supabase Auth account itself, via a single new Edge Function action
-- (see the admin-account-actions source, not this migration).
--
-- This migration only widens five FK delete rules from RESTRICT to
-- CASCADE so that a `DELETE FROM public.profiles` actually cascades
-- instead of being blocked. Nothing else about these tables changes —
-- column definitions, indexes, and RLS on all five are untouched.
--
-- IRREVERSIBLE BY DESIGN, exactly as requested: once a profile is
-- deleted, its sadhana history, any mentor_assignments row involving
-- them (even from the OTHER party's side — deleting a mentor also
-- erases the assignment record from their former devotees' history),
-- and any comments they authored are gone with no recovery path. This
-- is the explicit, approved tradeoff — the previous RESTRICT rules
-- existed specifically to make this impossible, and are being
-- deliberately removed here.
--
-- Replay-safe: DROP CONSTRAINT IF EXISTS followed by an unconditional
-- ADD CONSTRAINT converges to the same end state whether this is the
-- first run (constraint exists from 0001/0004/0011, gets replaced) or a
-- replay (constraint already CASCADE from a prior run of this file,
-- gets dropped and re-added identically).
-- ============================================================================

begin;

alter table public.sadhana_reports
  drop constraint if exists sadhana_reports_profile_id_fkey;
alter table public.sadhana_reports
  add constraint sadhana_reports_profile_id_fkey
  foreign key (profile_id) references public.profiles (id) on delete cascade;

alter table public.mentor_assignments
  drop constraint if exists mentor_assignments_mentor_id_fkey;
alter table public.mentor_assignments
  add constraint mentor_assignments_mentor_id_fkey
  foreign key (mentor_id) references public.profiles (id) on delete cascade;

alter table public.mentor_assignments
  drop constraint if exists mentor_assignments_devotee_id_fkey;
alter table public.mentor_assignments
  add constraint mentor_assignments_devotee_id_fkey
  foreign key (devotee_id) references public.profiles (id) on delete cascade;

alter table public.sadhana_report_comments
  drop constraint if exists sadhana_report_comments_mentor_id_fkey;
alter table public.sadhana_report_comments
  add constraint sadhana_report_comments_mentor_id_fkey
  foreign key (mentor_id) references public.profiles (id) on delete cascade;

alter table public.announcement_comments
  drop constraint if exists announcement_comments_author_id_fkey;
alter table public.announcement_comments
  add constraint announcement_comments_author_id_fkey
  foreign key (author_id) references public.profiles (id) on delete cascade;

commit;
