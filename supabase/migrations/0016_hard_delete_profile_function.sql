-- ============================================================================
-- Sadhana Connect — Phase 20C fix: hard_delete_profile()
--
-- Bug found during live verification of 0013's hard delete: the
-- admin-account-actions Edge Function's handleHardDelete() called
-- serviceClient.from('profiles').delete().eq('id', targetUserId)
-- directly — but service_role was never granted SELECT/DELETE on
-- public.profiles at the Postgres level (confirmed live: only
-- REFERENCES/TRIGGER/TRUNCATE). Every DELETE attempt failed with
-- 42501 insufficient_privilege, which the Edge Function's own generic
-- catch-all then surfaced to the client as an opaque
-- "Something went wrong" 502.
--
-- This was never a gap specific to hard delete — it's this project's
-- consistent, deliberate design (see 0010_admin_action_rate_limits.sql):
-- service_role is intentionally given ZERO direct table grants project
-- wide. Every capability it needs is instead exposed through a narrow,
-- single-purpose SECURITY DEFINER function, EXECUTE-granted only to
-- service_role — exactly the same shape as
-- check_and_increment_admin_rate_limit() (0010). A blanket
-- `grant delete on public.profiles to service_role` would have fixed
-- the immediate error too, but would have broken that established
-- least-privilege pattern by handing service_role standing, unscoped
-- DELETE access to the whole table. This function keeps the same
-- narrow shape instead: it can delete exactly one row, by id, nothing
-- else.
--
-- No RLS bypass concern: SECURITY DEFINER runs as the function owner
-- (the migration role), not as the caller — but this function is never
-- reachable by `authenticated`, only by `service_role`, and the Edge
-- Function is the only code path that ever holds a service-role client
-- (see admin-account-actions/index.ts's own header comment). The
-- Edge Function's existing authorization pipeline (super_admin check,
-- self-target rejection, peer-super_admin rejection, rate limiting)
-- remains the sole gate on who can reach this at all — this function
-- adds no new authorization logic of its own, same reasoning as every
-- other SECURITY DEFINER function in this schema.
-- ============================================================================

begin;

create or replace function public.hard_delete_profile(p_profile_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.profiles where id = p_profile_id;
$$;

revoke execute on function public.hard_delete_profile(uuid) from public;
grant execute on function public.hard_delete_profile(uuid) to service_role;

commit;
