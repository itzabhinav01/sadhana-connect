-- ============================================================================
-- Sadhana Connect — Phase 11: Verse of the Day (citation-only content table)
--
-- IMPORTANT — citation-only by design:
-- Sadhana Connect does not have confirmed written permission from the
-- Bhaktivedanta Book Trust to redistribute Śrīla Prabhupāda's Bhagavad-gītā
-- translation or purport text. This table stores and this application
-- displays ONLY factual reference metadata (chapter, verse number, a
-- canonical VedaBase URL) and a rotation position — never the scripture
-- text itself. Devotees read the actual verse/purport on VedaBase via
-- source_url. Do not add translation/purport columns to this table without
-- first re-running the Phase 11 licensing review.
--
-- Wrapped in an explicit transaction for atomicity, matching 0001.
-- ============================================================================

begin;

-- ============================================================================
-- 1. verse_citations
--
-- One row per Gita verse (or combined verse range) available for daily
-- rotation. Append-only by convention: order_index positions must never be
-- reused or reassigned once published, because
-- application/verse/select-verse-for-date.ts rotates deterministically by
-- `daysSinceEpoch(date) % publishedCount` — reordering or deleting a
-- published row would silently shift every later date's verse. Corrections
-- to a row's own content are safe (in place); corrections to *which* date a
-- verse appears on should use scheduled_date instead of reordering.
--
-- verse_number is `text`, not a numeric type: Prabhupāda's Bhagavad-gītā As
-- It Is sometimes combines verses under one translation/purport (e.g.
-- "20-22"), which a numeric column could not represent.
--
-- scheduled_date is nullable and unique-when-present (Postgres unique
-- constraints permit multiple NULLs), reserved for a future curator to pin
-- a specific verse to a specific calendar date, taking precedence over
-- rotation. No such curation workflow exists yet — this is schema
-- headroom only; there is no INSERT/UPDATE path from the application in
-- this phase (see RLS policies below).
-- ============================================================================

create table if not exists public.verse_citations (
  id uuid primary key default gen_random_uuid(),
  chapter smallint not null,
  verse_number text not null,
  source_url text not null,
  order_index integer not null,
  scheduled_date date,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint verse_citations_chapter_range check (chapter between 1 and 18),
  constraint verse_citations_order_index_nonneg check (order_index >= 0),
  constraint verse_citations_verse_number_not_blank check (char_length(trim(verse_number)) > 0),
  constraint verse_citations_source_url_not_blank check (char_length(trim(source_url)) > 0),
  constraint verse_citations_order_index_key unique (order_index),
  constraint verse_citations_scheduled_date_key unique (scheduled_date)
);

-- The unique constraints above already create the indexes that matter here
-- (rotation reads order by order_index; override lookups filter by
-- scheduled_date) — this table is small and curated by hand, so no
-- additional index is warranted.

-- ============================================================================
-- 2. updated_at trigger
--
-- Reuses public.set_updated_at(), already defined in 0001_initial_schema.
-- ============================================================================

create or replace trigger trg_verse_citations_set_updated_at
  before update on public.verse_citations
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 3. private.is_devotee() RLS helper
--
-- Same shape as private.is_super_admin() in 0001: SECURITY DEFINER, STABLE,
-- search_path pinned, lives in the `private` schema so it is never exposed
-- via PostgREST regardless of the EXECUTE grant below.
-- ============================================================================

create or replace function private.is_devotee()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'devotee' and is_active
  );
$$;

-- ============================================================================
-- 4. RLS enablement
-- ============================================================================

alter table public.verse_citations enable row level security;

-- ============================================================================
-- 5. RLS policies
--
-- SELECT only, restricted to active devotees, and only rows already marked
-- published — matches the Phase 11 approval ("Devotees may SELECT
-- published citation rows only"). No INSERT/UPDATE/DELETE policy exists for
-- any client role: Postgres RLS defaults to denying an operation entirely
-- when no policy grants it, and content authoring is explicitly Super Admin
-- scope (Phase 14), not yet implemented. Seed rows are inserted directly by
-- migration/admin SQL until then.
-- ============================================================================

drop policy if exists verse_citations_select on public.verse_citations;
create policy verse_citations_select
  on public.verse_citations
  for select
  to authenticated
  using (
    is_published
    and private.is_devotee()
  );

-- ============================================================================
-- 6. Exact least-privilege table grant
--
-- SELECT only — there is no INSERT/UPDATE/DELETE policy for any role, so no
-- corresponding grant is given either (an unmatched grant would be dead
-- privilege RLS could never actually authorize).
-- ============================================================================

grant select on public.verse_citations to authenticated;

-- ============================================================================
-- 7. Function EXECUTE grant
--
-- Required for RLS policy evaluation (the invoking role must hold EXECUTE
-- on any function a policy calls), and does not expose is_devotee() via
-- PostgREST — see the equivalent note in 0001 for private.is_super_admin().
-- ============================================================================

revoke execute on function private.is_devotee() from public;
grant execute on function private.is_devotee() to authenticated;

-- ============================================================================
-- 8. Seed data — approved 108-verse curated citation set
--
-- Every (chapter, verse_number, source_url) triple below was individually
-- verified against vedabase.io before this migration was written (see the
-- Phase 11 seed-data verification table) and is reproduced here exactly as
-- approved — no row was added, removed, reordered, or "corrected" beyond
-- that approved table. order_index 1-108 matches the curated list's own
-- numbering with no gaps. Combined verse references (e.g. "6-7") use a
-- plain hyphen, matching both the approved table and VedaBase's own URL
-- convention.
--
-- Citation metadata only: chapter, verse_number, and source_url are pure
-- reference facts, not copyrighted expression. No translation, purport,
-- Sanskrit/Devanagari, or transliteration text appears anywhere below,
-- consistent with the citation-only design documented at the top of this
-- file.
--
-- is_published = true and scheduled_date = null for every row: the whole
-- set rotates from day one via order_index (see
-- application/verse/select-verse-for-date.ts); no row is pinned to a
-- specific calendar date yet.
--
-- ON CONFLICT (order_index) DO NOTHING makes this block replay-safe: since
-- order_index is UNIQUE (section 1), reapplying this migration (e.g. an
-- accidental re-run) inserts nothing further rather than erroring or
-- duplicating rows. It deliberately does not overwrite existing rows on
-- conflict either — once a row exists, correcting it in place is a
-- separate, deliberate operation (see section 1's comment on corrections),
-- never an implicit side effect of reapplying this seed block.
-- ============================================================================

insert into public.verse_citations
  (order_index, chapter, verse_number, source_url, is_published, scheduled_date)
values
  (1, 1, '1', 'https://vedabase.io/en/library/bg/1/1/', true, null),
  (2, 1, '28', 'https://vedabase.io/en/library/bg/1/28/', true, null),
  (3, 1, '46', 'https://vedabase.io/en/library/bg/1/46/', true, null),
  (4, 2, '11', 'https://vedabase.io/en/library/bg/2/11/', true, null),
  (5, 2, '12', 'https://vedabase.io/en/library/bg/2/12/', true, null),
  (6, 2, '13', 'https://vedabase.io/en/library/bg/2/13/', true, null),
  (7, 2, '14', 'https://vedabase.io/en/library/bg/2/14/', true, null),
  (8, 2, '20', 'https://vedabase.io/en/library/bg/2/20/', true, null),
  (9, 2, '22', 'https://vedabase.io/en/library/bg/2/22/', true, null),
  (10, 2, '23', 'https://vedabase.io/en/library/bg/2/23/', true, null),
  (11, 2, '27', 'https://vedabase.io/en/library/bg/2/27/', true, null),
  (12, 2, '47', 'https://vedabase.io/en/library/bg/2/47/', true, null),
  (13, 2, '48', 'https://vedabase.io/en/library/bg/2/48/', true, null),
  (14, 2, '62', 'https://vedabase.io/en/library/bg/2/62/', true, null),
  (15, 2, '71', 'https://vedabase.io/en/library/bg/2/71/', true, null),
  (16, 3, '5', 'https://vedabase.io/en/library/bg/3/5/', true, null),
  (17, 3, '9', 'https://vedabase.io/en/library/bg/3/9/', true, null),
  (18, 3, '19', 'https://vedabase.io/en/library/bg/3/19/', true, null),
  (19, 3, '21', 'https://vedabase.io/en/library/bg/3/21/', true, null),
  (20, 3, '27', 'https://vedabase.io/en/library/bg/3/27/', true, null),
  (21, 3, '35', 'https://vedabase.io/en/library/bg/3/35/', true, null),
  (22, 4, '7', 'https://vedabase.io/en/library/bg/4/7/', true, null),
  (23, 4, '8', 'https://vedabase.io/en/library/bg/4/8/', true, null),
  (24, 4, '9', 'https://vedabase.io/en/library/bg/4/9/', true, null),
  (25, 4, '11', 'https://vedabase.io/en/library/bg/4/11/', true, null),
  (26, 4, '34', 'https://vedabase.io/en/library/bg/4/34/', true, null),
  (27, 4, '38', 'https://vedabase.io/en/library/bg/4/38/', true, null),
  (28, 5, '2', 'https://vedabase.io/en/library/bg/5/2/', true, null),
  (29, 5, '10', 'https://vedabase.io/en/library/bg/5/10/', true, null),
  (30, 5, '18', 'https://vedabase.io/en/library/bg/5/18/', true, null),
  (31, 5, '29', 'https://vedabase.io/en/library/bg/5/29/', true, null),
  (32, 6, '5', 'https://vedabase.io/en/library/bg/6/5/', true, null),
  (33, 6, '19', 'https://vedabase.io/en/library/bg/6/19/', true, null),
  (34, 6, '26', 'https://vedabase.io/en/library/bg/6/26/', true, null),
  (35, 6, '30', 'https://vedabase.io/en/library/bg/6/30/', true, null),
  (36, 6, '35', 'https://vedabase.io/en/library/bg/6/35/', true, null),
  (37, 6, '47', 'https://vedabase.io/en/library/bg/6/47/', true, null),
  (38, 7, '3', 'https://vedabase.io/en/library/bg/7/3/', true, null),
  (39, 7, '7', 'https://vedabase.io/en/library/bg/7/7/', true, null),
  (40, 7, '14', 'https://vedabase.io/en/library/bg/7/14/', true, null),
  (41, 7, '19', 'https://vedabase.io/en/library/bg/7/19/', true, null),
  (42, 7, '27', 'https://vedabase.io/en/library/bg/7/27/', true, null),
  (43, 7, '30', 'https://vedabase.io/en/library/bg/7/30/', true, null),
  (44, 8, '5', 'https://vedabase.io/en/library/bg/8/5/', true, null),
  (45, 8, '6', 'https://vedabase.io/en/library/bg/8/6/', true, null),
  (46, 8, '7', 'https://vedabase.io/en/library/bg/8/7/', true, null),
  (47, 8, '15', 'https://vedabase.io/en/library/bg/8/15/', true, null),
  (48, 8, '28', 'https://vedabase.io/en/library/bg/8/28/', true, null),
  (49, 9, '2', 'https://vedabase.io/en/library/bg/9/2/', true, null),
  (50, 9, '4', 'https://vedabase.io/en/library/bg/9/4/', true, null),
  (51, 9, '13', 'https://vedabase.io/en/library/bg/9/13/', true, null),
  (52, 9, '22', 'https://vedabase.io/en/library/bg/9/22/', true, null),
  (53, 9, '26', 'https://vedabase.io/en/library/bg/9/26/', true, null),
  (54, 9, '27', 'https://vedabase.io/en/library/bg/9/27/', true, null),
  (55, 9, '29', 'https://vedabase.io/en/library/bg/9/29/', true, null),
  (56, 9, '34', 'https://vedabase.io/en/library/bg/9/34/', true, null),
  (57, 10, '8', 'https://vedabase.io/en/library/bg/10/8/', true, null),
  (58, 10, '9', 'https://vedabase.io/en/library/bg/10/9/', true, null),
  (59, 10, '10', 'https://vedabase.io/en/library/bg/10/10/', true, null),
  (60, 10, '20', 'https://vedabase.io/en/library/bg/10/20/', true, null),
  (61, 10, '41', 'https://vedabase.io/en/library/bg/10/41/', true, null),
  (62, 10, '42', 'https://vedabase.io/en/library/bg/10/42/', true, null),
  (63, 11, '7', 'https://vedabase.io/en/library/bg/11/7/', true, null),
  (64, 11, '32', 'https://vedabase.io/en/library/bg/11/32/', true, null),
  (65, 11, '33', 'https://vedabase.io/en/library/bg/11/33/', true, null),
  (66, 11, '44', 'https://vedabase.io/en/library/bg/11/44/', true, null),
  (67, 11, '54', 'https://vedabase.io/en/library/bg/11/54/', true, null),
  (68, 11, '55', 'https://vedabase.io/en/library/bg/11/55/', true, null),
  (69, 12, '2', 'https://vedabase.io/en/library/bg/12/2/', true, null),
  (70, 12, '6-7', 'https://vedabase.io/en/library/bg/12/6-7/', true, null),
  (71, 12, '8', 'https://vedabase.io/en/library/bg/12/8/', true, null),
  (72, 12, '13-14', 'https://vedabase.io/en/library/bg/12/13-14/', true, null),
  (73, 12, '15', 'https://vedabase.io/en/library/bg/12/15/', true, null),
  (74, 12, '20', 'https://vedabase.io/en/library/bg/12/20/', true, null),
  (75, 13, '1-2', 'https://vedabase.io/en/library/bg/13/1-2/', true, null),
  (76, 13, '8-12', 'https://vedabase.io/en/library/bg/13/8-12/', true, null),
  (77, 13, '22', 'https://vedabase.io/en/library/bg/13/22/', true, null),
  (78, 13, '28', 'https://vedabase.io/en/library/bg/13/28/', true, null),
  (79, 13, '34', 'https://vedabase.io/en/library/bg/13/34/', true, null),
  (80, 14, '5', 'https://vedabase.io/en/library/bg/14/5/', true, null),
  (81, 14, '9', 'https://vedabase.io/en/library/bg/14/9/', true, null),
  (82, 14, '19', 'https://vedabase.io/en/library/bg/14/19/', true, null),
  (83, 14, '26', 'https://vedabase.io/en/library/bg/14/26/', true, null),
  (84, 14, '27', 'https://vedabase.io/en/library/bg/14/27/', true, null),
  (85, 15, '1', 'https://vedabase.io/en/library/bg/15/1/', true, null),
  (86, 15, '3-4', 'https://vedabase.io/en/library/bg/15/3-4/', true, null),
  (87, 15, '7', 'https://vedabase.io/en/library/bg/15/7/', true, null),
  (88, 15, '15', 'https://vedabase.io/en/library/bg/15/15/', true, null),
  (89, 15, '18', 'https://vedabase.io/en/library/bg/15/18/', true, null),
  (90, 15, '19', 'https://vedabase.io/en/library/bg/15/19/', true, null),
  (91, 16, '1-3', 'https://vedabase.io/en/library/bg/16/1-3/', true, null),
  (92, 16, '5', 'https://vedabase.io/en/library/bg/16/5/', true, null),
  (93, 16, '21', 'https://vedabase.io/en/library/bg/16/21/', true, null),
  (94, 16, '24', 'https://vedabase.io/en/library/bg/16/24/', true, null),
  (95, 17, '3', 'https://vedabase.io/en/library/bg/17/3/', true, null),
  (96, 17, '15', 'https://vedabase.io/en/library/bg/17/15/', true, null),
  (97, 17, '20', 'https://vedabase.io/en/library/bg/17/20/', true, null),
  (98, 17, '28', 'https://vedabase.io/en/library/bg/17/28/', true, null),
  (99, 18, '5', 'https://vedabase.io/en/library/bg/18/5/', true, null),
  (100, 18, '11', 'https://vedabase.io/en/library/bg/18/11/', true, null),
  (101, 18, '20', 'https://vedabase.io/en/library/bg/18/20/', true, null),
  (102, 18, '47', 'https://vedabase.io/en/library/bg/18/47/', true, null),
  (103, 18, '54', 'https://vedabase.io/en/library/bg/18/54/', true, null),
  (104, 18, '55', 'https://vedabase.io/en/library/bg/18/55/', true, null),
  (105, 18, '61', 'https://vedabase.io/en/library/bg/18/61/', true, null),
  (106, 18, '62', 'https://vedabase.io/en/library/bg/18/62/', true, null),
  (107, 18, '65', 'https://vedabase.io/en/library/bg/18/65/', true, null),
  (108, 18, '66', 'https://vedabase.io/en/library/bg/18/66/', true, null)
on conflict (order_index) do nothing;

commit;
