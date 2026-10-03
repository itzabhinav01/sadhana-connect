-- ============================================================================
-- Sadhana Connect — Migration 0024: Allow Mentors to Read Assigned Devotees' Temple Groups
--
-- Extends `profile_temple_groups_select` so a mentor can view the multi-group
-- memberships (`public.profile_temple_groups`) of their actively assigned
-- devotees (`private.is_mentor_of(profile_id)`), enabling group filtering and
-- group-based AI analysis on the Mentor Dashboard.
-- ============================================================================

begin;

drop policy if exists profile_temple_groups_select on public.profile_temple_groups;
create policy profile_temple_groups_select
  on public.profile_temple_groups
  for select
  to authenticated
  using (
    profile_id = auth.uid()
    or private.is_mentor_of(profile_id)
    or private.is_super_admin()
  );

commit;
