import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import PropertyForm from '../components/PropertyForm.jsx'
import PropertyFilters from '../components/PropertyFilters.jsx'
import PropertyImage from '../components/PropertyImage.jsx'
import { useViewMode } from '../hooks/useViewMode.js'
import {
  createProperty,
  deleteProperty,
  fetchProperties,
  updateProperty,
} from '../lib/propertiesApi.js'
import {
  DEFAULT_SORT,
  EMPTY_FILTERS,
  areaOptions,
  filterProperties,
  sortProperties,
} from '../lib/propertyFilters.js'

// 家賃を「￥185,000」の形式で表示する
const yen = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' })

// 登録日時を「YYYY-MM-DD」（ローカル時刻）で表示する
function formatDate(timestamp) {
  const d = new Date(timestamp)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function Properties() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // フォームの対象：null（閉じている）/ 'new'（新規登録）/ 編集中の物件
  const [formTarget, setFormTarget] = useState(null)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [sort, setSort] = useState(DEFAULT_SORT)
  const [viewMode, setViewMode] = useViewMode()
  const formRef = useRef(null)

  useEffect(() => {
    fetchProperties()
      .then(setProperties)
      .catch(() => setError('物件の読み込みに失敗しました。'))
      .finally(() => setLoading(false))
  }, [])

  // 編集を始めたらフォームが見える位置までスクロールする
  useEffect(() => {
    if (formTarget) formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [formTarget])

  const areas = useMemo(() => areaOptions(properties), [properties])
  const shown = useMemo(
    () => sortProperties(filterProperties(properties, filters, user.id), sort),
    [properties, filters, sort, user.id],
  )

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
    navigate('/login', { replace: true })
  }

  async function handleSubmit(values, image) {
    if (formTarget === 'new') {
      const created = await createProperty(user.id, values, image)
      setProperties((prev) => [created, ...prev])
    } else {
      const updated = await updateProperty(user.id, formTarget, values, image)
      setProperties((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    }
    setFormTarget(null)
  }

  async function handleDelete(property) {
    if (!window.confirm(`「${property.name}」を削除しますか？`)) return
    setError('')
    try {
      await deleteProperty(property)
      setProperties((prev) => prev.filter((p) => p.id !== property.id))
      if (formTarget?.id === property.id) setFormTarget(null)
    } catch {
      setError('削除に失敗しました。時間をおいて再度お試しください。')
    }
  }

  // 自分の物件なら公開状態のバッジと編集・削除ボタン、他ユーザーの物件なら閲覧のみ
  function renderOwnership(p) {
    if (p.user_id !== user.id) return <span className="badge others">他ユーザー（閲覧のみ）</span>
    return p.is_public ? (
      <span className="badge public">公開中</span>
    ) : (
      <span className="badge private">非公開</span>
    )
  }

  function renderActions(p) {
    if (p.user_id !== user.id) return null
    return (
      <div className="card-actions">
        <button type="button" className="secondary" onClick={() => setFormTarget(p)}>
          編集
        </button>
        <button type="button" className="danger" onClick={() => handleDelete(p)}>
          削除
        </button>
      </div>
    )
  }

  function renderTiles() {
    return (
      <ul className="property-list">
        {shown.map((p) => (
          <li key={p.id} className="property-card">
            <PropertyImage src={p.imageUrl} alt={p.name} />
            <div className="property-card-body">
              {renderOwnership(p)}
              <h2>{p.name}</h2>
              <p className="rent">
                {yen.format(p.rent)}
                <span>／月</span>
              </p>
              <p className="area">{p.area}</p>
              <p className="date">登録日：{formatDate(p.created_at)}</p>
              {renderActions(p)}
            </div>
          </li>
        ))}
      </ul>
    )
  }

  function renderTable() {
    return (
      <div className="table-wrapper">
        <table className="property-table">
          <thead>
            <tr>
              <th>画像</th>
              <th>物件名</th>
              <th>家賃（月）</th>
              <th>所在地</th>
              <th>登録日</th>
              <th>公開</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => (
              <tr key={p.id}>
                <td>
                  <PropertyImage src={p.imageUrl} alt={p.name} className="thumb" />
                </td>
                <td className="name">{p.name}</td>
                <td className="rent">{yen.format(p.rent)}</td>
                <td>{p.area}</td>
                <td>{formatDate(p.created_at)}</td>
                <td>{renderOwnership(p)}</td>
                <td>{renderActions(p)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="properties-page">
      <header className="header">
        <h1>物件一覧</h1>
        <div className="header-user">
          <span className="email">{user?.email}</span>
          <button type="button" onClick={handleSignOut} disabled={signingOut}>
            ログアウト
          </button>
        </div>
      </header>

      <section className="toolbar" ref={formRef}>
        {formTarget ? (
          <div className="property-card form-panel">
            <h2>{formTarget === 'new' ? '物件を追加' : '物件を編集'}</h2>
            <PropertyForm
              // 対象が変わったらフォームを作り直して入力値を初期化する
              key={formTarget === 'new' ? 'new' : formTarget.id}
              initial={formTarget === 'new' ? undefined : formTarget}
              submitLabel={formTarget === 'new' ? '追加' : '保存'}
              onSubmit={handleSubmit}
              onCancel={() => setFormTarget(null)}
            />
          </div>
        ) : (
          <button type="button" onClick={() => setFormTarget('new')}>
            ＋ 物件を追加
          </button>
        )}
      </section>

      <PropertyFilters
        filters={filters}
        onChange={setFilters}
        sort={sort}
        onSortChange={setSort}
        areas={areas}
      />

      <div className="list-header">
        <p className="count">
          {properties.length} 件中 {shown.length} 件を表示
        </p>
        <div className="view-toggle" role="group" aria-label="表示形式">
          <button
            type="button"
            className={viewMode === 'tile' ? 'active' : ''}
            aria-pressed={viewMode === 'tile'}
            onClick={() => setViewMode('tile')}
          >
            タイル
          </button>
          <button
            type="button"
            className={viewMode === 'list' ? 'active' : ''}
            aria-pressed={viewMode === 'list'}
            onClick={() => setViewMode('list')}
          >
            一覧
          </button>
        </div>
      </div>

      {error && <p className="message error">{error}</p>}

      {loading ? (
        <p className="loading">読み込み中…</p>
      ) : properties.length === 0 ? (
        <p className="empty">物件はまだ登録されていません。「物件を追加」から登録してください。</p>
      ) : shown.length === 0 ? (
        <p className="empty">条件に合う物件はありません。</p>
      ) : viewMode === 'list' ? (
        renderTable()
      ) : (
        renderTiles()
      )}
    </div>
  )
}
