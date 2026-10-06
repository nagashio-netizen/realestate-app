import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { properties } from '../data/properties.js'

// 家賃を「￥185,000」の形式で表示する
const yen = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' })

export default function Properties() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
    navigate('/login', { replace: true })
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

      <ul className="property-list">
        {properties.map((p) => (
          <li key={p.id} className="property-card">
            <h2>{p.name}</h2>
            <p className="rent">
              {yen.format(p.rent)}
              <span>／月</span>
            </p>
            <p className="area">{p.area}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
