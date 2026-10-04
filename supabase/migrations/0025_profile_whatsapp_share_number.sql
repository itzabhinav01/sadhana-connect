-- ============================================================================
-- Sadhana Connect — Configurable WhatsApp Share Number on Profiles
--
-- Allows each user to configure their preferred WhatsApp recipient number
-- (e.g., their mentor's number) in their Profile for sharing daily Sadhana
-- charts, replacing any hardcoded personal number in source code.
-- ============================================================================

begin;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'whatsapp_share_number'
  ) then
    alter table public.profiles add column whatsapp_share_number text;
  end if;
end;
$$;

commit;
