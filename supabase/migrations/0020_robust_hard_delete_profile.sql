-- ============================================================================
-- Sadhana Connect — Migration 0020: Robust and Safe Hard Delete Profile
--
-- Ensures that when a mentor or devotee profile is deleted by a Super Admin:
--   1. All mentor_assignments (both where this user is mentor or devotee)
--      are deleted cleanly, unlinking all mentees/mentors.
--   2. All authored comments (sadhana report comments, announcement comments)
--      are deleted cleanly.
--   3. All sadhana reports and notifications are deleted cleanly.
--   4. Any references where this user was assigned_by or author_id are set to NULL.
--   5. Admin rate limits are cleaned up.
--   6. The profiles row is deleted, allowing auth.admin.deleteUser() to proceed
--      without constraint violations or orphan records in the database.
-- ============================================================================

begin;

create or replace function public.hard_delete_profile(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 1. Cleanly delete mentor assignments involving this user (as mentor or devotee)
  delete from public.mentor_assignments
  where mentor_id = p_profile_id or devotee_id = p_profile_id;

  -- 2. Cleanly delete sadhana report comments authored by this mentor
  delete from public.sadhana_report_comments
  where mentor_id = p_profile_id;

  -- 3. Cleanly delete announcement comments authored by this user
  delete from public.announcement_comments
  where author_id = p_profile_id;

  -- 4. Cleanly delete sadhana reports of this user
  delete from public.sadhana_reports
  where profile_id = p_profile_id;

  -- 5. Cleanly delete notifications for this user
  delete from public.notifications
  where recipient_id = p_profile_id;

  -- 6. Cleanly nullify audit columns referencing this user
  update public.mentor_assignments
  set assigned_by = null
  where assigned_by = p_profile_id;

  update public.announcements
  set author_id = null
  where author_id = p_profile_id;

  -- 7. Cleanly delete admin action rate limits for this user
  delete from private.admin_action_rate_limits
  where admin_id = p_profile_id;

  -- 8. Delete the profile itself
  delete from public.profiles
  where id = p_profile_id;
end;
$$;

revoke execute on function public.hard_delete_profile(uuid) from public;
grant execute on function public.hard_delete_profile(uuid) to service_role;

commit;
