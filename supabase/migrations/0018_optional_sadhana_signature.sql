-- ============================================================================
-- Sadhana Connect — Make sadhana_reports.signature_text optional
--
-- Product decision: signature is no longer a required field on the Daily
-- Sadhana form. Drops the NOT NULL constraint and the
-- sadhana_reports_signature_not_blank CHECK constraint added in
-- 0001_initial_schema.sql, so a report can be submitted with no
-- signature (NULL) — same nullability pattern already used for
-- book_name, speaker_name, and notes on this table.
--
-- No backfill: every existing row already has a non-blank signature (the
-- constraint being dropped guaranteed that), so there is nothing to
-- migrate for past data — this only changes what's allowed going
-- forward.
--
-- No RLS changes: sadhana_reports_select/_insert/_update do not
-- reference signature_text, so its nullability is invisible to policy
-- logic.
-- ============================================================================

begin;

do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'sadhana_reports_signature_not_blank'
  ) then
    alter table public.sadhana_reports
      drop constraint sadhana_reports_signature_not_blank;
  end if;
end;
$$;

alter table public.sadhana_reports
  alter column signature_text drop not null;

commit;
