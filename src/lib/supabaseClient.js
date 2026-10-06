import { createClient } from '@supabase/supabase-js'

// 接続情報は .env から読み込む（VITE_ で始まる変数だけがブラウザ側に公開される）
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Supabase の接続情報が見つかりません。.env に VITE_SUPABASE_URL と VITE_SUPABASE_PUBLISHABLE_KEY を設定してください。',
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)
