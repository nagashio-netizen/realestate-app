import { supabase } from './supabaseClient.js'

// 物件テーブル（public.properties）の読み書き
// RLS により、ログイン中のユーザー自身の物件だけが対象になる
const COLUMNS = 'id, name, rent, area, created_at, updated_at'

export async function fetchProperties() {
  const { data, error } = await supabase
    .from('properties')
    .select(COLUMNS)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createProperty({ name, rent, area }) {
  const { data, error } = await supabase
    .from('properties')
    .insert({ name, rent, area })
    .select(COLUMNS)
    .single()
  if (error) throw error
  return data
}

export async function updateProperty(id, { name, rent, area }) {
  const { data, error } = await supabase
    .from('properties')
    .update({ name, rent, area })
    .eq('id', id)
    .select(COLUMNS)
    .single()
  if (error) throw error
  return data
}

export async function deleteProperty(id) {
  const { error } = await supabase.from('properties').delete().eq('id', id)
  if (error) throw error
}
