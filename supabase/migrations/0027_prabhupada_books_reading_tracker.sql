-- ============================================================================
-- Sadhana Connect — Migration 0027: Prabhupada Books Reading Tracker
--
-- 1. Creates public.prabhupada_books containing the 36 canonical Srila Prabhupada
--    books in their recommended reading sequence, complete with verified online
--    reading URLs (Vedabase, PrabhupadaBooks, etc.).
-- 2. Creates public.devotee_book_progress tracking each devotee's reading status
--    per book ('not_started', 'reading', 'completed').
-- 3. Configures Row Level Security (RLS) so:
--    - Devotees can view and update their own book progress.
--    - Mentors can view the reading progress of their assigned devotees.
--    - Super Admins can view reading progress across all devotees.
--    - All users can read the catalog of Prabhupada books.
-- ============================================================================

begin;

-- ============================================================================
-- 1. Table: public.prabhupada_books
-- ============================================================================

create table if not exists public.prabhupada_books (
  id serial primary key,
  sequence_number integer not null unique,
  title text not null,
  reading_url text,
  created_at timestamptz not null default now()
);

alter table public.prabhupada_books enable row level security;

drop policy if exists prabhupada_books_select on public.prabhupada_books;
create policy prabhupada_books_select
  on public.prabhupada_books
  for select
  to authenticated, anon
  using (true);

grant select on public.prabhupada_books to authenticated, anon;

-- Seed the 36 books in recommended sequence
insert into public.prabhupada_books (sequence_number, title, reading_url) values
  (1, 'On The Way to Krishna', 'https://vedabase.io/en/library/owk/'),
  (2, 'Elevation to Krishna Consciousness', 'https://prabhupadabooks.com/etkc'),
  (3, 'Krishna Consciousness the Matchless Gift', 'https://www.scribd.com/document/272562031/Krsna-Consciousness-the-Matchless-Gift'),
  (4, 'Krishna the Reservoir of Pleasure', 'https://prabhupadabooks.com/krop'),
  (5, 'Perfection of Yoga', 'https://vedabase.io/en/library/pop/'),
  (6, 'Krishna Consciousness – The Topmost Yoga System', 'https://prabhupadabooks.com/tys'),
  (7, 'Beyond Birth and Death', 'https://vedabase.io/en/library/bbd/'),
  (8, 'Perfect Questions, Perfect Answers', 'https://vedabase.io/en/library/pqpa/'),
  (9, 'Easy Journey to Other Planets', 'https://vedabase.io/en/library/easy/'),
  (10, 'Raja Vidya: The King of Knowledge', 'https://vedabase.io/en/library/rvk/'),
  (11, 'Transcendental Teachings of Prahlad Maharaj', 'https://theharekrishnamovement.org/2016/02/04/transcendental-teachings-of-prahlada-maharaja-4/'),
  (12, 'Coming Back', 'https://www.harekrishna.com/col/books/KR/cb/'),
  (13, 'Message of Godhead', 'https://vedabase.io/en/library/mog/'),
  (14, 'Civilization and Transcendence', 'https://vedabase.io/en/library/cat/'),
  (15, 'Hare Krishna Challenge', 'https://divineoutset.com/wp-content/uploads/2025/08/Hare-K%E1%B9%9B%E1%B9%A3%E1%B9%87a-Challenge-PDF-English.pdf'),
  (16, 'Scientific Basis of Krishna Consciousness', 'https://krishna.org/wp-content/uploads/2016/07/The-Scientific-Basis-of-Krishna-Consciousness-Svarupa-Damodar-dasa-Ph.D..pdf'),
  (17, 'Sword of Knowledge', null),
  (18, 'Nectar of Instruction', 'https://vedabase.io/en/library/noi/'),
  (19, 'Path of Perfection', 'https://vedabase.io/en/library/path/'),
  (20, 'Prabhupada Lilamrita', 'https://vedabase.io/en/library/spl/'),
  (21, 'Introduction to Bhagvad Gita As It Is', null),
  (22, 'Science of Self-Realization', 'https://vedabase.io/en/library/sosr/'),
  (23, 'Journey of Self Discovery', 'https://vedabase.io/en/library/josd/'),
  (24, 'Life Comes from Life', 'https://prabhupadabooks.com/lcfl'),
  (25, 'Nectar of Devotion (Only Part One)', 'https://vedabase.io/en/library/nd/'),
  (26, 'Teachings of Queen Kunti', 'https://vedabase.io/en/library/tqk/'),
  (27, 'Teachings of Lord Kapila', 'https://vedabase.io/en/library/tlk/'),
  (28, 'Teachings of Lord Chaitanya', 'https://vedabase.io/en/library/tlc/'),
  (29, 'Sri Isopanishad', 'https://vedabase.io/en/library/iso/'),
  (30, 'Krishna Book', 'https://vedabase.io/en/library/kb/'),
  (31, 'Srimad Bhagavatam (1st Canto)', 'https://vedabase.io/en/library/sb/1/'),
  (32, 'A Second Chance', 'https://vedabase.io/en/library/sc/'),
  (33, 'Bhagvad Gita As It Is', 'https://vedabase.io/en/library/bg/'),
  (34, 'Srimad Bhagavatam (Canto By Canto)', 'https://vedabase.io/en/library/sb/'),
  (35, 'Nectar Of Devotion (Part II And Part III)', null),
  (36, 'Chaitanya Charitamrita', 'https://vedabase.io/en/library/cc/')
on conflict (sequence_number) do update
  set title = excluded.title,
      reading_url = excluded.reading_url;

-- ============================================================================
-- 2. Table: public.devotee_book_progress
-- ============================================================================

create table if not exists public.devotee_book_progress (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  book_id integer not null references public.prabhupada_books (id) on delete cascade,
  status text not null default 'not_started'
    constraint devotee_book_progress_status_valid check (status in ('not_started', 'reading', 'completed')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint devotee_book_progress_unique unique (profile_id, book_id)
);

create index if not exists devotee_book_progress_profile_idx
  on public.devotee_book_progress (profile_id);

create index if not exists devotee_book_progress_book_idx
  on public.devotee_book_progress (book_id);

alter table public.devotee_book_progress enable row level security;

-- Devotee can view their own, mentors can view assigned devotees, super admins view all
drop policy if exists devotee_book_progress_select on public.devotee_book_progress;
create policy devotee_book_progress_select
  on public.devotee_book_progress
  for select
  to authenticated
  using (
    profile_id = auth.uid()
    or private.is_mentor_of(profile_id)
    or private.is_super_admin()
  );

-- Devotee can insert their own book progress
drop policy if exists devotee_book_progress_insert on public.devotee_book_progress;
create policy devotee_book_progress_insert
  on public.devotee_book_progress
  for insert
  to authenticated
  with check (
    profile_id = auth.uid()
    or private.is_super_admin()
  );

-- Devotee can update their own book progress
drop policy if exists devotee_book_progress_update on public.devotee_book_progress;
create policy devotee_book_progress_update
  on public.devotee_book_progress
  for update
  to authenticated
  using (
    profile_id = auth.uid()
    or private.is_super_admin()
  )
  with check (
    profile_id = auth.uid()
    or private.is_super_admin()
  );

-- Devotee can delete their own book progress
drop policy if exists devotee_book_progress_delete on public.devotee_book_progress;
create policy devotee_book_progress_delete
  on public.devotee_book_progress
  for delete
  to authenticated
  using (
    profile_id = auth.uid()
    or private.is_super_admin()
  );

grant select, insert, update, delete on public.devotee_book_progress to authenticated;

commit;
