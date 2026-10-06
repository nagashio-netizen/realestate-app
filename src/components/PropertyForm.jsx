import { useState } from 'react'

// 物件の登録・編集フォーム
// initial を渡すと編集、渡さなければ新規登録として使う
export default function PropertyForm({ initial, submitLabel, onSubmit, onCancel }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [rent, setRent] = useState(initial ? String(initial.rent) : '')
  const [area, setArea] = useState(initial?.area ?? '')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // 家賃は円単位の整数として扱う
    const rentValue = Number(rent)
    if (!Number.isSafeInteger(rentValue) || rentValue < 0) {
      setError('家賃は 0 以上の整数（円）で入力してください。')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({ name: name.trim(), rent: rentValue, area: area.trim() })
      if (!initial) {
        setName('')
        setRent('')
        setArea('')
      }
    } catch {
      setError('保存に失敗しました。時間をおいて再度お試しください。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="property-form" onSubmit={handleSubmit}>
      <label>
        物件名
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
      </label>

      <label>
        家賃（円／月）
        <input
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          value={rent}
          onChange={(e) => setRent(e.target.value)}
          required
        />
      </label>

      <label>
        所在地
        <input value={area} onChange={(e) => setArea(e.target.value)} maxLength={100} required />
      </label>

      {error && <p className="message error">{error}</p>}

      <div className="form-actions">
        <button type="submit" disabled={submitting}>
          {submitting ? '保存中…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="secondary" onClick={onCancel} disabled={submitting}>
            キャンセル
          </button>
        )}
      </div>
    </form>
  )
}
