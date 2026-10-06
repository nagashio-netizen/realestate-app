-- 物件テーブル
-- 各ユーザーは自分が登録した物件だけを参照・編集できる（行レベルセキュリティで制御）
create table if not exists public.properties (
  id bigint generated always as identity primary key,
  -- 登録したユーザー。未指定なら現在ログイン中のユーザーが入る
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  -- 家賃（円単位の整数）
  rent integer not null check (rent >= 0),
  area text not null check (char_length(area) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists properties_user_id_idx on public.properties (user_id);

-- 更新時に updated_at を自動で更新する
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists properties_set_updated_at on public.properties;
create trigger properties_set_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

-- 行レベルセキュリティ（RLS）を有効化し、本人の行だけ操作できるようにする
alter table public.properties enable row level security;

drop policy if exists "本人の物件を参照できる" on public.properties;
create policy "本人の物件を参照できる" on public.properties
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "本人の物件を登録できる" on public.properties;
create policy "本人の物件を登録できる" on public.properties
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "本人の物件を更新できる" on public.properties;
create policy "本人の物件を更新できる" on public.properties
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "本人の物件を削除できる" on public.properties;
create policy "本人の物件を削除できる" on public.properties
  for delete to authenticated
  using ((select auth.uid()) = user_id);
