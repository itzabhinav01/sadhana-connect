-- ============================================================================
-- Sadhana Connect — Phase 22: Push Notifications (Expo Push + Device Tokens)
--
-- 1. Creates public.push_tokens to store device Expo Push Tokens per profile.
-- 2. Adds public.register_push_token() and public.unregister_push_token() RPCs
--    so authenticated mobile/web clients can register their device token safely
--    (automatically moving a token if a device switches accounts).
-- 3. Enables pg_net and adds an AFTER INSERT trigger on public.notifications
--    (public.dispatch_push_notification) that sends background push notifications
--    via Expo's Push API (https://exp.host/--/api/v2/push/send) whenever any
--    notification (announcement, mentor_comment, sadhana_reminder, data_retention)
--    is inserted.
-- 4. Updates public.hard_delete_profile to remove push_tokens rows.
-- ============================================================================

begin;

create extension if not exists pg_net;

-- ============================================================================
-- 1. Table: public.push_tokens
-- ============================================================================

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  expo_push_token text not null,
  platform text not null default 'android'
    constraint push_tokens_platform_valid check (platform in ('android', 'ios', 'web')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_tokens_unique_token unique (expo_push_token)
);

create index if not exists push_tokens_profile_idx
  on public.push_tokens (profile_id);

alter table public.push_tokens enable row level security;

drop policy if exists push_tokens_select on public.push_tokens;
create policy push_tokens_select
  on public.push_tokens
  for select
  to authenticated
  using (
    profile_id = auth.uid()
    or private.is_super_admin()
  );

drop policy if exists push_tokens_delete on public.push_tokens;
create policy push_tokens_delete
  on public.push_tokens
  for delete
  to authenticated
  using (
    profile_id = auth.uid()
    or private.is_super_admin()
  );

grant select, delete on public.push_tokens to authenticated;

-- ============================================================================
-- 2. RPCs: register_push_token & unregister_push_token
-- ============================================================================

create or replace function public.register_push_token(
  p_expo_push_token text,
  p_platform text default 'android'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_trimmed text := trim(coalesce(p_expo_push_token, ''));
  v_platform text := lower(trim(coalesce(p_platform, 'android')));
begin
  if v_uid is null or not private.is_active_profile(v_uid) then
    return;
  end if;

  if v_trimmed = '' then
    return;
  end if;

  if v_platform not in ('android', 'ios', 'web') then
    v_platform := 'android';
  end if;

  insert into public.push_tokens (profile_id, expo_push_token, platform, updated_at)
  values (v_uid, v_trimmed, v_platform, now())
  on conflict (expo_push_token) do update
    set profile_id = excluded.profile_id,
        platform = excluded.platform,
        updated_at = now();
end;
$$;

revoke execute on function public.register_push_token(text, text) from public;
grant execute on function public.register_push_token(text, text) to authenticated;

create or replace function public.unregister_push_token(
  p_expo_push_token text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  delete from public.push_tokens
  where profile_id = auth.uid()
    and expo_push_token = trim(coalesce(p_expo_push_token, ''));
end;
$$;

revoke execute on function public.unregister_push_token(text) from public;
grant execute on function public.unregister_push_token(text) to authenticated;

-- ============================================================================
-- 3. Trigger: dispatch_push_notification on public.notifications INSERT
-- ============================================================================

create or replace function public.dispatch_push_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url text;
  v_report_date date;
  v_messages jsonb;
begin
  -- Resolve mobile deep-link target URL
  if new.type = 'announcement' and new.related_announcement_id is not null then
    v_url := '/devotee/announcements/' || new.related_announcement_id::text;
  elsif new.type = 'mentor_comment' and new.related_report_id is not null then
    select report_date into v_report_date
    from public.sadhana_reports
    where id = new.related_report_id;

    if v_report_date is not null then
      v_url := '/devotee/sadhana?date=' || to_char(v_report_date, 'YYYY-MM-DD');
    else
      v_url := '/devotee/sadhana';
    end if;
  elsif new.type = 'sadhana_reminder' then
    v_url := '/devotee/sadhana';
  elsif new.type = 'data_retention' then
    v_url := '/devotee/history';
  else
    v_url := '/devotee/notifications';
  end if;

  select jsonb_agg(
    jsonb_build_object(
      'to', pt.expo_push_token,
      'title', new.title,
      'body', coalesce(new.body, ''),
      'sound', 'default',
      'priority', 'high',
      'channelId', 'sadhana-alerts',
      'data', jsonb_build_object(
        'url', v_url,
        'notificationId', new.id,
        'type', new.type
      )
    )
  )
  into v_messages
  from public.push_tokens pt
  where pt.profile_id = new.recipient_id;

  if v_messages is not null and jsonb_array_length(v_messages) > 0 then
    begin
      perform net.http_post(
        url := 'https://exp.host/--/api/v2/push/send',
        body := v_messages,
        headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb
      );
    exception
      when others then
        -- Never fail a notification insert if pg_net is unavailable or network fails
        null;
    end;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_dispatch_push_notification on public.notifications;
create trigger trg_dispatch_push_notification
  after insert on public.notifications
  for each row
  execute function public.dispatch_push_notification();

-- ============================================================================
-- 4. Update hard_delete_profile to clean up push_tokens
-- ============================================================================

create or replace function public.hard_delete_profile(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.push_tokens
  where profile_id = p_profile_id;

  delete from public.profile_temple_groups
  where profile_id = p_profile_id;

  delete from public.mentor_assignments
  where mentor_id = p_profile_id or devotee_id = p_profile_id;

  delete from public.sadhana_report_comments
  where mentor_id = p_profile_id;

  delete from public.announcement_comments
  where author_id = p_profile_id;

  delete from public.sadhana_reports
  where profile_id = p_profile_id;

  delete from public.notifications
  where recipient_id = p_profile_id;

  update public.mentor_assignments
  set assigned_by = null
  where assigned_by = p_profile_id;

  update public.announcements
  set author_id = null
  where author_id = p_profile_id;

  delete from private.admin_action_rate_limits
  where admin_id = p_profile_id;

  delete from public.profiles
  where id = p_profile_id;
end;
$$;

revoke execute on function public.hard_delete_profile(uuid) from public;
grant execute on function public.hard_delete_profile(uuid) to service_role;

commit;
