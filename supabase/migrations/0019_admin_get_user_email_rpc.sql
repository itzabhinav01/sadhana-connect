-- ============================================================================
-- Sadhana Connect — Super Admin: get_user_email() RPC
--
-- Enables authenticated super_admins to retrieve a user's email address
-- securely from auth.users on-demand via RPC, avoiding Edge Function dependency
-- and configuration hurdles while strictly enforcing security checks.
-- ============================================================================

begin;

create or replace function public.get_user_email(p_target_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text;
begin
  -- Caller must be an active super_admin OR requesting their own email
  if not (private.is_super_admin() or auth.uid() = p_target_user_id) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select email into v_email
  from auth.users
  where id = p_target_user_id;

  if v_email is null then
    raise exception 'User not found or no email on file' using errcode = 'P0002';
  end if;

  return v_email;
end;
$$;

revoke execute on function public.get_user_email(uuid) from public;
grant execute on function public.get_user_email(uuid) to authenticated;

commit;
