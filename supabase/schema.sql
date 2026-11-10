-- PIXEL MUSEUM 스키마. Supabase 대시보드의 SQL Editor에 붙여넣어 한 번 실행한다.
-- 다시 실행해도 오류가 나지 않도록 작성했다.

-- 1) 미술관: 사용자 1명당 1개. 이름 기본값은 "김동구전", 목록 공개가 기본이다.
create table if not exists public.museums (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null unique references auth.users (id) on delete cascade,
  name       text not null default '김동구전' check (char_length(name) between 1 and 40),
  is_public  boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2) 작품: 미술관의 슬롯(0~11 벽 액자, 12 중앙 조각상) 하나에 최대 1점
create table if not exists public.artworks (
  id          uuid primary key default gen_random_uuid(),
  museum_id   uuid not null references public.museums (id) on delete cascade,
  slot        int  not null check (slot between 0 and 12),
  title       text not null check (char_length(title) between 1 and 60),
  description text not null default '' check (char_length(description) <= 500),
  image_path  text not null,
  created_at  timestamptz not null default now(),
  unique (museum_id, slot)
);

-- 3) RLS: 읽기는 공개 미술관(또는 내 것)만, 쓰기는 주인만
alter table public.museums  enable row level security;
alter table public.artworks enable row level security;

drop policy if exists "museums: read public or own" on public.museums;
create policy "museums: read public or own" on public.museums
  for select using (is_public or owner_id = auth.uid());

drop policy if exists "museums: update own" on public.museums;
create policy "museums: update own" on public.museums
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- museums의 insert는 가입 트리거(security definer)만 한다. delete는 계정 삭제(cascade)로만 일어난다.

drop policy if exists "artworks: read in readable museum" on public.artworks;
create policy "artworks: read in readable museum" on public.artworks
  for select using (
    exists (select 1 from public.museums m
            where m.id = museum_id and (m.is_public or m.owner_id = auth.uid()))
  );

drop policy if exists "artworks: insert own" on public.artworks;
create policy "artworks: insert own" on public.artworks
  for insert with check (
    exists (select 1 from public.museums m where m.id = museum_id and m.owner_id = auth.uid())
  );

drop policy if exists "artworks: update own" on public.artworks;
create policy "artworks: update own" on public.artworks
  for update
  using      (exists (select 1 from public.museums m where m.id = museum_id and m.owner_id = auth.uid()))
  with check (exists (select 1 from public.museums m where m.id = museum_id and m.owner_id = auth.uid()));

drop policy if exists "artworks: delete own" on public.artworks;
create policy "artworks: delete own" on public.artworks
  for delete using (
    exists (select 1 from public.museums m where m.id = museum_id and m.owner_id = auth.uid())
  );

-- 4) 가입하면 내 미술관 "김동구전"을 자동으로 만든다
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.museums (owner_id) values (new.id)
  on conflict (owner_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5) 스토리지: 작품 이미지는 공개 버킷 "artworks"에 "<내 user id>/파일명"으로 저장한다
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('artworks', 'artworks', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 공개 URL로 이미지를 보는 데는 정책이 필요 없지만, Storage API의 삭제·덮어쓰기는 대상 행을 먼저 조회한다.
-- 그래서 로그인한 사용자가 "자기 폴더"의 파일 목록은 조회할 수 있어야 한다(남의 폴더는 조회 불가).
drop policy if exists "artworks bucket: select own folder" on storage.objects;
create policy "artworks bucket: select own folder" on storage.objects
  for select to authenticated
  using (bucket_id = 'artworks' and (storage.foldername(name))[1] = auth.uid()::text);

-- 쓰기는 자기 폴더(첫 경로 조각 = 내 user id)만 허용한다.
drop policy if exists "artworks bucket: insert own folder" on storage.objects;
create policy "artworks bucket: insert own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'artworks' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "artworks bucket: update own folder" on storage.objects;
create policy "artworks bucket: update own folder" on storage.objects
  for update to authenticated
  using (bucket_id = 'artworks' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "artworks bucket: delete own folder" on storage.objects;
create policy "artworks bucket: delete own folder" on storage.objects
  for delete to authenticated
  using (bucket_id = 'artworks' and (storage.foldername(name))[1] = auth.uid()::text);

-- 6) 방명록: 읽을 수 있는 미술관(공개 또는 내 것)에 로그인한 누구나(게스트 포함) 한 줄 남길 수 있다.
create table if not exists public.guestbook_entries (
  id          uuid primary key default gen_random_uuid(),
  museum_id   uuid not null references public.museums (id) on delete cascade,
  author_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  author_name text not null check (char_length(author_name) between 1 and 20),
  message     text not null check (char_length(message) between 1 and 200),
  created_at  timestamptz not null default now()
);
create index if not exists guestbook_entries_museum_created_idx
  on public.guestbook_entries (museum_id, created_at desc);

alter table public.guestbook_entries enable row level security;

drop policy if exists "guestbook: read in readable museum" on public.guestbook_entries;
create policy "guestbook: read in readable museum" on public.guestbook_entries
  for select using (
    exists (select 1 from public.museums m
            where m.id = museum_id and (m.is_public or m.owner_id = auth.uid()))
  );

-- 글쓴이는 본인(author_id = 내 id)으로만 쓸 수 있다. 남의 이름으로 쓰는 것은 막힌다.
drop policy if exists "guestbook: insert as self" on public.guestbook_entries;
create policy "guestbook: insert as self" on public.guestbook_entries
  for insert to authenticated with check (
    author_id = auth.uid()
    and exists (select 1 from public.museums m
                where m.id = museum_id and (m.is_public or m.owner_id = auth.uid()))
  );

-- 지우기는 쓴 사람 본인 또는 미술관 주인만. 수정은 허용하지 않는다(정책 없음).
drop policy if exists "guestbook: delete own or museum owner" on public.guestbook_entries;
create policy "guestbook: delete own or museum owner" on public.guestbook_entries
  for delete to authenticated using (
    author_id = auth.uid()
    or exists (select 1 from public.museums m where m.id = museum_id and m.owner_id = auth.uid())
  );
