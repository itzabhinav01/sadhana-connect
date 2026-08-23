-- ============================================================================
-- Sadhana Connect — Phase 20C: Compulsory phone number
--
-- Adds profiles.phone_number. Nullable at the database level even though
-- it is compulsory for new registrations — a NOT NULL column would
-- require inventing a placeholder value for every existing real
-- account, which this project's rules explicitly forbid ("never invent
-- production data"). "Compulsory" is enforced where it can honestly be
-- enforced: the registration form's Zod schema before signUp() is ever
-- called, and the CHECK constraint below as the authoritative backstop
-- against a malformed/bypassed direct insert. Existing accounts simply
-- show no phone number until the devotee adds one via Profile — no
-- migration-time backfill is invented for them.
--
-- No RLS changes: profiles_select already grants a devotee's assigned
-- mentor and any super_admin full-row SELECT (0001) — phone_number is
-- automatically visible to both the moment the application layer
-- selects/renders it, same as full_name already is. profiles_update
-- already allows a devotee to update their own non-restricted columns
-- (protect_profile_restricted_columns only gates role/is_active/
-- temple_group_id), so no new UPDATE policy is needed either.
-- ============================================================================

begin;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'phone_number'
  ) then
    alter table public.profiles add column phone_number text;
  end if;
end;
$$;

-- E.164-shaped: '+' followed by 7–15 digits, first digit 1–9. Approved
-- format (international, + country code required). NULL is always
-- valid — see the nullability note above.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_phone_number_format'
  ) then
    alter table public.profiles
      add constraint profiles_phone_number_format
      check (phone_number is null or phone_number ~ '^\+[1-9]\d{6,14}$');
  end if;
end;
$$;

-- ============================================================================
-- handle_new_user() — now also captures phone_number from signup metadata,
-- the exact same NULL-safe pattern already used for full_name. No
-- fallback default is invented if it's missing (unlike full_name's
-- 'New Devotee' fallback) — an honest NULL is correct here; a fake phone
-- number would not be.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
declare
  v_full_name text;
  v_phone_number text;
begin
  v_full_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');
  v_phone_number := nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone_number', '')), '');

  insert into public.profiles (id, full_name, role, is_active, phone_number)
  values (
    new.id,
    coalesce(v_full_name, 'New Devotee'),
    'devotee',
    true,
    v_phone_number
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

commit;
