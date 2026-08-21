-- ============================================================================
-- Sadhana Connect — Phase 19 remediation round 2: admin action rate limiting
--
-- Fixes the MEDIUM finding from the Phase 19 security audit: no rate
-- limiting existed on supabase/functions/admin-account-actions (ban,
-- unban, generate_recovery_link, get_user_email) beyond generic platform
-- defaults. A valid super_admin token could mass-invoke any of these
-- with no throttling.
--
-- Design (approved before implementation — see the Phase 19 remediation
-- round 1 report):
--   * Durable, cross-instance-safe: Edge Functions are stateless across
--     multiple isolated instances, so an in-memory counter is not a real
--     limit — this must be backed by Postgres, the one piece of state
--     every instance already shares.
--   * No new secret: the Edge Function already holds a service-role-
--     equivalent key for the Auth Admin calls these four actions make;
--     this reuses that, rather than introducing a new credential.
--   * Narrow surface: one small table, in the `private` schema (never
--     PostgREST-exposed, same as private.is_super_admin() etc.), with
--     ZERO grants to any role — not even service_role directly (see
--     below for why that's still sufficient).
--
-- ----------------------------------------------------------------------
-- Why a wrapper function, when the approved design only specified the
-- table:
--
-- `private` is deliberately not in this project's exposed-schemas list
-- (that's the whole point of the schema — see 0001's `revoke all on
-- schema private from public`), so it is not reachable at all through
-- PostgREST's `.from()`/`.schema()` — not even with the service-role
-- key, since schema exposure is a project-level PostgREST setting
-- orthogonal to which role is calling. A raw direct Postgres connection
-- would sidestep that, but would require a NEW secret (a database
-- connection string), which the approved design explicitly ruled out.
--
-- The only way to reach a private-schema table from an Edge Function
-- using the EXISTING service-role key is a `public`-schema function,
-- callable via PostgREST RPC, whose body reaches into `private`
-- directly — exactly the same shape already used throughout this
-- schema for `private.is_super_admin()` and friends, just in reverse
-- (a public entry point wrapping private-schema logic, rather than a
-- private helper called from public-schema policies).
--
-- check_and_increment_admin_rate_limit() is that entry point: SECURITY
-- DEFINER (owned by the migration role, which has full access to
-- `private` regardless of what service_role's own default grants are —
-- avoids depending on an assumption about service_role's implicit
-- privileges), EXECUTE granted ONLY to service_role (not authenticated,
-- not anon, not PUBLIC), performing exactly one atomic UPSERT and
-- nothing else. Because the function itself provides the only path to
-- the table and only service_role may call it, the table needs no
-- grants of its own to any role at all — a stricter posture than
-- granting service_role direct table access.
-- ============================================================================

begin;

create table if not exists private.admin_action_rate_limits (
  admin_id uuid not null references public.profiles (id) on delete cascade,
  action text not null,
  window_start timestamptz not null default now(),
  request_count integer not null default 0,
  primary key (admin_id, action)
);

alter table private.admin_action_rate_limits enable row level security;
-- No policies defined for any operation, for any role — RLS-enabled
-- with zero policies denies every row to every non-bypassing role by
-- default. Belt-and-suspenders alongside "not PostgREST-exposed" and
-- "no grants to anyone": this table has no reachable path from
-- authenticated or anon under any circumstance. The SECURITY DEFINER
-- function below is owned by a role that bypasses RLS (the migration
-- role), so this does not block its own access.

revoke all on private.admin_action_rate_limits from public;
revoke all on private.admin_action_rate_limits from authenticated;
revoke all on private.admin_action_rate_limits from anon;
-- No grant statement follows any of these — intentionally zero grants
-- to any role, on this table, ever.

-- Returns only the resulting request_count for the window — it has no
-- opinion on what the limit is. Each action's limit is a fixed constant
-- in the Edge Function (ban/unban: 20, get_user_email: 30,
-- generate_recovery_link: 5, all per 5 minutes), alongside the rest of
-- that function's per-action logic, rather than being threaded through
-- the database — this function's only job is the atomic count itself.
create or replace function public.check_and_increment_admin_rate_limit(
  p_admin_id uuid,
  p_action text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into private.admin_action_rate_limits (admin_id, action, window_start, request_count)
  values (p_admin_id, p_action, now(), 1)
  on conflict (admin_id, action) do update
    set
      request_count = case
        when now() - private.admin_action_rate_limits.window_start > interval '5 minutes'
          then 1
        else private.admin_action_rate_limits.request_count + 1
      end,
      window_start = case
        when now() - private.admin_action_rate_limits.window_start > interval '5 minutes'
          then now()
        else private.admin_action_rate_limits.window_start
      end
  returning request_count into v_count;

  return v_count;
end;
$$;

-- The INSERT ... ON CONFLICT ... DO UPDATE ... RETURNING above is one
-- statement: Postgres resolves it atomically per row via the primary
-- key's implicit unique index, so two concurrent calls for the same
-- (admin_id, action) — whether from the same Edge Function instance or
-- two different ones — serialize on that row rather than racing; the
-- loser sees the winner's already-incremented count, never a lost
-- update.

revoke all on function public.check_and_increment_admin_rate_limit(uuid, text) from public;
grant execute on function public.check_and_increment_admin_rate_limit(uuid, text) to service_role;

commit;
