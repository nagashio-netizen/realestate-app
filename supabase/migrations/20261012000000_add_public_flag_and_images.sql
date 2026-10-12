-- 物件に「公開フラグ」と「画像」を追加する
-- ・公開した物件は他のユーザーも閲覧できる（編集・削除は所有者のみ）
-- ・画像は Storage の property-images バケットに「<ユーザーID>/<ファイル名>」で保存する

alter table public.properties
  add column if not exists is_public boolean not null default false,
  -- Storage 上の画像のパス（画像なしなら null）
  add column if not exists image_path text;

-- 参照ポリシーを「本人の物件、または公開された物件」に置き換える
drop policy if exists "本人の物件を参照できる" on public.properties;
drop policy if exists "本人の物件と公開物件を参照できる" on public.properties;
create policy "本人の物件と公開物件を参照できる" on public.properties
  for select to authenticated
  using ((select auth.uid()) = user_id or is_public);

-- 画像用バケット（非公開。表示には署名付き URL を使う）
-- 1ファイル 5MB まで、画像形式のみ
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-images',
  'property-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 画像の参照：自分のフォルダの画像、または公開物件の画像
drop policy if exists "物件画像を参照できる" on storage.objects;
create policy "物件画像を参照できる" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'property-images'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (
        select 1 from public.properties p
        where p.image_path = storage.objects.name and p.is_public
      )
    )
  );

-- 画像のアップロード・更新・削除：自分のフォルダのみ
drop policy if exists "自分の物件画像をアップロードできる" on storage.objects;
create policy "自分の物件画像をアップロードできる" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "自分の物件画像を更新できる" on storage.objects;
create policy "自分の物件画像を更新できる" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "自分の物件画像を削除できる" on storage.objects;
create policy "自分の物件画像を削除できる" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
