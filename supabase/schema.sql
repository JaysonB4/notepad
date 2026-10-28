-- Run this once in your Supabase project: SQL Editor -> New query -> paste -> Run.
-- Account notes live in one table. Row-level security makes sure each person can only
-- read and change their own rows, even though the browser holds the public anon key.

create table if not exists public.notes (
  id          uuid primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title       text not null default '',
  plain_text  text not null default '',
  content     jsonb,
  updated_at  timestamptz not null default now()
);

-- Size limits so one account can't fill the database with huge notes.
-- Drop-then-add keeps this safe to re-run on an existing table.
alter table public.notes drop constraint if exists notes_title_len;
alter table public.notes add constraint notes_title_len
  check (char_length(title) <= 500);

alter table public.notes drop constraint if exists notes_text_len;
alter table public.notes add constraint notes_text_len
  check (char_length(plain_text) <= 200000);

alter table public.notes drop constraint if exists notes_content_len;
alter table public.notes add constraint notes_content_len
  check (content is null or pg_column_size(content) <= 1000000);

create index if not exists notes_user_updated_idx on public.notes (user_id, updated_at desc);

alter table public.notes enable row level security;

create policy "Read own notes"
  on public.notes for select
  using (auth.uid() = user_id);

create policy "Add own notes"
  on public.notes for insert
  with check (auth.uid() = user_id);

create policy "Change own notes"
  on public.notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Delete own notes"
  on public.notes for delete
  using (auth.uid() = user_id);
