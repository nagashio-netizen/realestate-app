import { supabase } from './supabaseClient.js'

// 物件テーブル（public.properties）と物件画像（Storage）の読み書き
// RLS により、参照は「自分の物件＋公開物件」、変更は自分の物件だけが対象になる
const COLUMNS = 'id, user_id, name, rent, area, is_public, image_path, created_at, updated_at'
const IMAGE_BUCKET = 'property-images'
// 画像の署名付き URL の有効期限（秒）
const IMAGE_URL_EXPIRES_IN = 60 * 60

// 各物件に画像の表示用 URL（imageUrl）を付ける。画像がなければ null
async function withImageUrls(rows) {
  const paths = rows.map((p) => p.image_path).filter(Boolean)
  if (paths.length === 0) return rows.map((p) => ({ ...p, imageUrl: null }))

  const { data, error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .createSignedUrls(paths, IMAGE_URL_EXPIRES_IN)
  // URL が取れなくても一覧自体は表示できるよう、画像なし扱いにする
  const urls = new Map(error ? [] : data.filter((d) => !d.error).map((d) => [d.path, d.signedUrl]))
  return rows.map((p) => ({ ...p, imageUrl: urls.get(p.image_path) ?? null }))
}

// 画像をアップロードし、保存先のパスを返す
async function uploadImage(userId, file) {
  const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : 'img'
  const path = `${userId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type })
  if (error) throw error
  return path
}

// 画像を削除する（失敗しても物件の操作は成功扱いにする）
async function removeImage(path) {
  if (!path) return
  await supabase.storage.from(IMAGE_BUCKET).remove([path])
}

export async function fetchProperties() {
  const { data, error } = await supabase
    .from('properties')
    .select(COLUMNS)
    .order('created_at', { ascending: false })
  if (error) throw error
  return withImageUrls(data)
}

// image: { file: 新しい画像 File または null, remove: 既存画像を外すか }
export async function createProperty(userId, { name, rent, area, is_public }, image) {
  const imagePath = image?.file ? await uploadImage(userId, image.file) : null

  const { data, error } = await supabase
    .from('properties')
    .insert({ name, rent, area, is_public, image_path: imagePath })
    .select(COLUMNS)
    .single()
  if (error) {
    await removeImage(imagePath)
    throw error
  }
  const [created] = await withImageUrls([data])
  return created
}

export async function updateProperty(userId, current, { name, rent, area, is_public }, image) {
  let imagePath = current.image_path
  if (image?.file) imagePath = await uploadImage(userId, image.file)
  else if (image?.remove) imagePath = null

  const { data, error } = await supabase
    .from('properties')
    .update({ name, rent, area, is_public, image_path: imagePath })
    .eq('id', current.id)
    .select(COLUMNS)
    .single()
  if (error) {
    if (imagePath !== current.image_path) await removeImage(imagePath)
    throw error
  }
  // 差し替え・削除した古い画像を片付ける
  if (imagePath !== current.image_path) await removeImage(current.image_path)

  const [updated] = await withImageUrls([data])
  return updated
}

export async function deleteProperty(property) {
  const { error } = await supabase.from('properties').delete().eq('id', property.id)
  if (error) throw error
  await removeImage(property.image_path)
}
