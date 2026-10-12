import { EMPTY_FILTERS, SORT_OPTIONS } from '../lib/propertyFilters.js'

// 検索・絞り込み・並べ替えの入力欄
export default function PropertyFilters({ filters, onChange, sort, onSortChange, areas }) {
  function update(key, value) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <form className="filters" role="search" onSubmit={(e) => e.preventDefault()}>
      <label className="filter-keyword">
        キーワード
        <input
          type="search"
          value={filters.keyword}
          onChange={(e) => update('keyword', e.target.value)}
          placeholder="物件名・所在地"
        />
      </label>

      <label>
        エリア
        <select value={filters.area} onChange={(e) => update('area', e.target.value)}>
          <option value="">すべて</option>
          {areas.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="filter-rent">
        <legend>家賃（円／月）</legend>
        <input
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          value={filters.rentMin}
          onChange={(e) => update('rentMin', e.target.value)}
          placeholder="下限なし"
          aria-label="家賃の下限"
        />
        <span>〜</span>
        <input
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          value={filters.rentMax}
          onChange={(e) => update('rentMax', e.target.value)}
          placeholder="上限なし"
          aria-label="家賃の上限"
        />
      </fieldset>

      <label>
        所有者
        <select value={filters.owner} onChange={(e) => update('owner', e.target.value)}>
          <option value="all">すべて</option>
          <option value="mine">自分の物件</option>
          <option value="others">他ユーザーの公開物件</option>
        </select>
      </label>

      <label>
        並べ替え
        <select value={sort} onChange={(e) => onSortChange(e.target.value)}>
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <button type="button" className="secondary" onClick={() => onChange(EMPTY_FILTERS)}>
        条件をクリア
      </button>
    </form>
  )
}
