-- ============================================================================
-- Sadhana Connect — Study Hours Section & Decimal Support for Rest/Study Hours
--
-- 1. Adds `study_hours` (double precision, default 0, >= 0) to
--    `public.sadhana_reports` so students can log their daily study hours
--    (including decimal values such as 1.5, 2.5, etc.).
-- 2. Alters `total_rest_minutes` (which stores Total Rest in hours on the
--    Sadhana form) from `smallint` to `double precision` so devotees can
--    precisely track decimal rest hours (e.g., 6.5 hours).
-- ============================================================================

begin;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'sadhana_reports'
      and column_name = 'study_hours'
  ) then
    alter table public.sadhana_reports
      add column study_hours double precision not null default 0
      constraint sadhana_reports_study_hours_nonneg check (study_hours >= 0);
  end if;
end;
$$;

alter table public.sadhana_reports
  alter column total_rest_minutes type double precision
  using total_rest_minutes::double precision;

commit;
