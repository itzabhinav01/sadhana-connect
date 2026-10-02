-- ============================================================================
-- Sadhana Connect — Migration 0021: Multiple Temple Group Memberships
--
-- Allows any user (mentor or devotee) to belong to multiple temple groups:
--   1. Creates `public.profile_temple_groups` join table (M:N between
--      `public.profiles` and `public.temple_groups`).
--   2. Backfills existing `profiles.temple_group_id` values into
--      `public.profile_temple_groups`.
--   3. Keeps `profiles.temple_group_id` synchronized with the primary
--      (earliest) group membership via trigger for backward compatibility.
--   4. Updates `private.can_publish_announcement` so a mentor assigned to
--      multiple temple groups can publish announcements to any of their
--      assigned temple groups.
--   5. Updates `announcements_select` RLS policy so devotees and mentors
--      can view announcements for all temple groups they belong to.
--   6. Updates `public.notify_on_announcement_published` so notifications
--      fan out to all active devotees in that temple group.
--   7. Updates `public.hard_delete_profile` to clean up memberships.
-- ============================================================================

begin;

-- ============================================================================
-- 1. profile_temple_groups join table & indexes
-- ============================================================================

create table if not exists public.profile_temple_groups (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  temple_group_id uuid not null references public.temple_groups (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint profile_temple_groups_unique_pair unique (profile_id, temple_group_id)
);

create index if not exists profile_temple_groups_profile_idx
  on public.profile_temple_groups (profile_id, created_at asc);

create index if not exists profile_temple_groups_group_idx
  on public.profile_temple_groups (temple_group_id);

-- ============================================================================
-- 2. Backfill existing profiles.temple_group_id rows
-- ============================================================================

insert into public.profile_temple_groups (profile_id, temple_group_id)
select id, temple_group_id
from public.profiles
where temple_group_id is not null
on conflict (profile_id, temple_group_id) do nothing;

-- ============================================================================
-- 3. Trigger to keep profiles.temple_group_id synced as primary fallback
-- ============================================================================

create or replace function public.sync_profile_primary_temple_group()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_profile_id uuid;
  v_primary_group_id uuid;
begin
  v_target_profile_id := coalesce(new.profile_id, old.profile_id);

  select temple_group_id into v_primary_group_id
  from public.profile_temple_groups
  where profile_id = v_target_profile_id
  order by created_at asc, id asc
  limit 1;

  update public.profiles
  set temple_group_id = v_primary_group_id
  where id = v_target_profile_id
    and temple_group_id is distinct from v_primary_group_id;

  return coalesce(new, old);
end;
$$;

revoke execute on function public.sync_profile_primary_temple_group() from public;

drop trigger if exists trg_profile_temple_groups_sync_primary on public.profile_temple_groups;
create trigger trg_profile_temple_groups_sync_primary
  after insert or delete on public.profile_temple_groups
  for each row
  execute function public.sync_profile_primary_temple_group();

-- ============================================================================
-- 4. RLS & Grants on profile_temple_groups
-- ============================================================================

alter table public.profile_temple_groups enable row level security;

drop policy if exists profile_temple_groups_select on public.profile_temple_groups;
create policy profile_temple_groups_select
  on public.profile_temple_groups
  for select
  to authenticated
  using (
    profile_id = auth.uid()
    or private.is_super_admin()
  );

drop policy if exists profile_temple_groups_insert on public.profile_temple_groups;
create policy profile_temple_groups_insert
  on public.profile_temple_groups
  for insert
  to authenticated
  with check (private.is_super_admin());

drop policy if exists profile_temple_groups_delete on public.profile_temple_groups;
create policy profile_temple_groups_delete
  on public.profile_temple_groups
  for delete
  to authenticated
  using (private.is_super_admin());

grant select, insert, delete on public.profile_temple_groups to authenticated;

-- ============================================================================
-- 5. Update private.can_publish_announcement for multi-group mentors
-- ============================================================================

create or replace function private.can_publish_announcement(p_scope text, p_temple_group_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select case
    when private.is_super_admin() then true
    when exists (
      select 1 from public.profiles where id = auth.uid() and role = 'mentor' and is_active
    ) then
      p_scope = 'temple_group'
      and p_temple_group_id is not null
      and (
        exists (
          select 1
          from public.profile_temple_groups ptg
          where ptg.profile_id = auth.uid()
            and ptg.temple_group_id = p_temple_group_id
        )
        or exists (
          select 1
          from public.profiles p
          where p.id = auth.uid()
            and p.temple_group_id = p_temple_group_id
        )
      )
    else false
  end;
$$;

-- ============================================================================
-- 6. Update announcements_select RLS policy for multi-group members
-- ============================================================================

drop policy if exists announcements_select on public.announcements;
create policy announcements_select
  on public.announcements
  for select
  to authenticated
  using (
    (
      is_published
      and private.is_active_profile(auth.uid())
      and (expires_at is null or expires_at > now())
      and (
        scope = 'all'
        or (
          scope = 'devotees'
          and exists (select 1 from public.profiles where id = auth.uid() and role = 'devotee')
        )
        or (
          scope = 'mentors'
          and exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
        )
        or (
          scope = 'temple_group'
          and temple_group_id is not null
          and (
            exists (
              select 1
              from public.profile_temple_groups ptg
              where ptg.profile_id = auth.uid()
                and ptg.temple_group_id = announcements.temple_group_id
            )
            or exists (
              select 1
              from public.profiles p
              where p.id = auth.uid()
                and p.temple_group_id = announcements.temple_group_id
            )
          )
        )
      )
    )
    or (author_id = auth.uid() and private.is_active_profile(auth.uid()))
    or private.is_super_admin()
  );

-- ============================================================================
-- 7. Update notify_on_announcement_published for multi-group devotees
-- ============================================================================

create or replace function public.notify_on_announcement_published()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications
    (recipient_id, type, title, body, related_announcement_id, related_report_id)
  select
    p.id,
    'announcement',
    new.title,
    new.content,
    new.id,
    null
  from public.profiles p
  where p.role = 'devotee'
    and p.is_active
    and (
      new.scope = 'all'
      or new.scope = 'devotees'
      or (
        new.scope = 'temple_group'
        and new.temple_group_id is not null
        and (
          exists (
            select 1
            from public.profile_temple_groups ptg
            where ptg.profile_id = p.id
              and ptg.temple_group_id = new.temple_group_id
          )
          or p.temple_group_id = new.temple_group_id
        )
      )
    );

  return new;
end;
$$;

-- ============================================================================
-- 8. Update hard_delete_profile to clean up profile_temple_groups
-- ============================================================================

create or replace function public.hard_delete_profile(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
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
