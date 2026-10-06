import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import PropertyForm from '../components/PropertyForm.jsx'
import {
  createProperty,
  deleteProperty,
  fetchProperties,
  updateProperty,
} from '../lib/propertiesApi.js'

// 家賃を「￥185,000」の形式で表示する
const yen = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' })

export default function Properties() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  // 編集中の物件 ID（編集していなければ null）
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    fetchProperties()
      .then(setProperties)
      .catch(() => setError('物件の読み込みに失敗しました。'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
    navigate('/login', { replace: true })
  }

  async function handleCreate(values) {
    const created = await createProperty(values)
    setProperties((prev) => [created, ...prev])
    setAdding(false)
  }

  async function handleUpdate(id, values) {
    const updated = await updateProperty(id, values)
    setProperties((prev) => prev.map((p) => (p.id === id ? updated : p)))
    setEditingId(null)
  }

  async function handleDelete(property) {
    if (!window.confirm(`「${property.name}」を削除しますか？`)) return
    setError('')
    try {
      await deleteProperty(property.id)
      setProperties((prev) => prev.filter((p) => p.id !== property.id))
    } catch {
      setError('削除に失敗しました。時間をおいて再度お試しください。')
    }
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

      <section className="toolbar">
        {adding ? (
          <div className="property-card">
            <h2>物件を追加</h2>
            <PropertyForm
              submitLabel="追加"
              onSubmit={handleCreate}
              onCancel={() => setAdding(false)}
            />
          </div>
        ) : (
          <button type="button" onClick={() => setAdding(true)}>
            ＋ 物件を追加
          </button>
        )}
      </section>

      {error && <p className="message error">{error}</p>}

      {loading ? (
        <p className="loading">読み込み中…</p>
      ) : properties.length === 0 ? (
        <p className="empty">物件はまだ登録されていません。「物件を追加」から登録してください。</p>
      ) : (
        <ul className="property-list">
          {properties.map((p) => (
            <li key={p.id} className="property-card">
              {editingId === p.id ? (
                <PropertyForm
                  initial={p}
                  submitLabel="保存"
                  onSubmit={(values) => handleUpdate(p.id, values)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <>
                  <h2>{p.name}</h2>
                  <p className="rent">
                    {yen.format(p.rent)}
                    <span>／月</span>
                  </p>
                  <p className="area">{p.area}</p>
                  <div className="card-actions">
                    <button type="button" className="secondary" onClick={() => setEditingId(p.id)}>
                      編集
                    </button>
                    <button type="button" className="danger" onClick={() => handleDelete(p)}>
                      削除
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
