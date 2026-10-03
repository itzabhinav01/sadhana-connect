-- ============================================================================
-- Sadhana Connect — Migration 0023: Enhanced Mentor Comment Notifications
--
-- 1. Updates public.notify_on_mentor_comment() so in-app and push notifications
--    include the commenting mentor's name and the report date in the title.
-- 2. Updates public.dispatch_push_notification() so tapping a mentor_comment
--    push notification opens `/devotee/sadhana?date=YYYY-MM-DD&openComments=1`.
-- ============================================================================

begin;

create or replace function public.notify_on_mentor_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient_id uuid;
  v_report_date date;
  v_title text;
begin
  select profile_id, report_date
    into v_recipient_id, v_report_date
  from public.sadhana_reports
  where id = new.sadhana_report_id;

  if v_recipient_id is not null then
    v_title := 'Mentor comment from ' || new.mentor_name;
    if v_report_date is not null then
      v_title := v_title || ' (' || to_char(v_report_date, 'DD Mon') || ')';
    end if;

    insert into public.notifications
      (recipient_id, type, title, body, related_report_id, related_announcement_id)
    values (
      v_recipient_id,
      'mentor_comment',
      v_title,
      case
        when char_length(new.comment_text) > 200
          then left(new.comment_text, 200) || '…'
        else new.comment_text
      end,
      new.sadhana_report_id,
      null
    );
  end if;

  return new;
end;
$$;

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
  if new.type = 'announcement' and new.related_announcement_id is not null then
    v_url := '/devotee/announcements/' || new.related_announcement_id::text;
  elsif new.type = 'mentor_comment' and new.related_report_id is not null then
    select report_date into v_report_date
    from public.sadhana_reports
    where id = new.related_report_id;

    if v_report_date is not null then
      v_url := '/devotee/sadhana?date=' || to_char(v_report_date, 'YYYY-MM-DD') || '&openComments=1';
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
        null;
    end;
  end if;

  return new;
end;
$$;

commit;
