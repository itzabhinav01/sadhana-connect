-- ============================================================================
-- Sadhana Connect — Phase 12: Mentor Dashboard support view
--
-- mentor_devotee_last_reports — the all-time most recent report_date per
-- devotee, needed so the Mentor Dashboard can show "last report ever
-- submitted" rather than only what falls inside the 7-day activity window.
-- PostgREST's plain table API has no GROUP BY/aggregate syntax, so a view
-- is the mechanism, not a new table or a SECURITY DEFINER function.
--
-- security_invoker = true is the entire security model: this view adds NO
-- authorization logic of its own. It runs with the CALLING role's own
-- privileges, so public.sadhana_reports' existing RLS policy
-- (sadhana_reports_select, defined in 0001_initial_schema) applies to the
-- view's underlying query exactly as if the caller had run
-- `select profile_id, max(report_date) ... from sadhana_reports group by
-- profile_id` themselves. A mentor querying this view can only ever
-- aggregate over rows sadhana_reports_select already lets them read
-- (their own row, or a devotee they are actively assigned to via
-- private.is_mentor_of(), or none at all for a super admin's broader
-- reach — same three branches as every other query against this table).
-- Nothing here re-derives, re-checks, or narrows that policy — there is
-- no mentor_assignments reference, no is_mentor_of() call, and no new
-- policy anywhere in this file, on purpose.
-- ============================================================================

begin;

create or replace view public.mentor_devotee_last_reports
with (security_invoker = true)
as
  select
    profile_id as devotee_id,
    max(report_date) as last_report_date
  from public.sadhana_reports
  group by profile_id;

-- Exact least-privilege grant: SELECT only, to authenticated only. No
-- INSERT/UPDATE/DELETE grant is given (views over a GROUP BY are not
-- updatable in Postgres regardless, but the grant is omitted explicitly
-- rather than left to that incidental fact). No grant to anon: an
-- unauthenticated caller has no session, so sadhana_reports_select would
-- deny every row to them anyway (auth.uid() is null there), but the grant
-- is scoped correctly regardless of that fallback.
grant select on public.mentor_devotee_last_reports to authenticated;

commit;
