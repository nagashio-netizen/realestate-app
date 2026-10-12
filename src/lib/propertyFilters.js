// 物件一覧の検索・絞り込み・並べ替え

export const EMPTY_FILTERS = {
  keyword: '',
  area: '',
  rentMin: '',
  rentMax: '',
  // all: すべて / mine: 自分の物件 / others: 他ユーザーの公開物件
  owner: 'all',
}

export const SORT_OPTIONS = [
  { value: 'created_desc', label: '登録日（新しい順）' },
  { value: 'created_asc', label: '登録日（古い順）' },
  { value: 'rent_asc', label: '家賃（安い順）' },
  { value: 'rent_desc', label: '家賃（高い順）' },
  { value: 'area_asc', label: 'エリア（昇順）' },
  { value: 'area_desc', label: 'エリア（降順）' },
]

export const DEFAULT_SORT = 'created_desc'

// 所在地から都道府県を取り出す（取り出せなければ所在地そのものを返す）
export function prefectureOf(area) {
  const match = area.match(/^(北海道|東京都|京都府|大阪府|.{2,3}県)/)
  return match ? match[1] : area
}

// 絞り込み用のエリア（都道府県）一覧
export function areaOptions(properties) {
  return [...new Set(properties.map((p) => prefectureOf(p.area)))].sort((a, b) =>
    a.localeCompare(b, 'ja'),
  )
}

// 全角・半角や大文字・小文字の違いを無視して比較できるようにする
function normalize(text) {
  return text.normalize('NFKC').toLowerCase()
}

// 空欄・不正な値は「条件なし」として null を返す
function toYen(value) {
  if (value === '') return null
  const n = Number(value)
  return Number.isSafeInteger(n) && n >= 0 ? n : null
}

export function filterProperties(properties, filters, userId) {
  const keyword = normalize(filters.keyword.trim())
  const rentMin = toYen(filters.rentMin)
  const rentMax = toYen(filters.rentMax)

  return properties.filter((p) => {
    if (keyword && !normalize(`${p.name} ${p.area}`).includes(keyword)) return false
    if (filters.area && prefectureOf(p.area) !== filters.area) return false
    if (rentMin !== null && p.rent < rentMin) return false
    if (rentMax !== null && p.rent > rentMax) return false
    if (filters.owner === 'mine' && p.user_id !== userId) return false
    if (filters.owner === 'others' && p.user_id === userId) return false
    return true
  })
}

const time = (p) => new Date(p.created_at).getTime()

const COMPARATORS = {
  created_desc: (a, b) => time(b) - time(a),
  created_asc: (a, b) => time(a) - time(b),
  rent_asc: (a, b) => a.rent - b.rent,
  rent_desc: (a, b) => b.rent - a.rent,
  area_asc: (a, b) => a.area.localeCompare(b.area, 'ja'),
  area_desc: (a, b) => b.area.localeCompare(a.area, 'ja'),
}

export function sortProperties(properties, sort) {
  return [...properties].sort(COMPARATORS[sort] ?? COMPARATORS[DEFAULT_SORT])
}
