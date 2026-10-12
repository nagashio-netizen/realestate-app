import { useEffect, useState } from 'react'
import PropertyImage from './PropertyImage.jsx'

// 画像は 5MB まで（Storage バケットの設定と合わせる）
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// 物件の登録・編集フォーム
// initial を渡すと編集、渡さなければ新規登録として使う
// onSubmit(values, image) の image は { file: 新しい画像, remove: 既存画像を外すか }
export default function PropertyForm({ initial, submitLabel, onSubmit, onCancel }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [rent, setRent] = useState(initial ? String(initial.rent) : '')
  const [area, setArea] = useState(initial?.area ?? '')
  const [isPublic, setIsPublic] = useState(initial?.is_public ?? false)
  const [imageFile, setImageFile] = useState(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 選択した画像のプレビュー用 URL を作り、不要になったら破棄する
  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(imageFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  function handleImageChange(e) {
    const file = e.target.files[0] ?? null
    setError('')
    if (file && !IMAGE_TYPES.includes(file.type)) {
      setError('画像は JPEG・PNG・WebP・GIF 形式を選んでください。')
      e.target.value = ''
      return
    }
    if (file && file.size > MAX_IMAGE_SIZE) {
      setError('画像のサイズは 5MB 以下にしてください。')
      e.target.value = ''
      return
    }
    setImageFile(file)
    if (file) setRemoveImage(false)
  }

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
      await onSubmit(
        { name: name.trim(), rent: rentValue, area: area.trim(), is_public: isPublic },
        { file: imageFile, remove: removeImage },
      )
    } catch {
      setError('保存に失敗しました。時間をおいて再度お試しください。')
    } finally {
      setSubmitting(false)
    }
  }

  // プレビューに出す画像：新しく選んだ画像 → 既存の画像（外す指定がなければ）
  const shownImage = previewUrl ?? (removeImage ? null : initial?.imageUrl)

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
        <input
          value={area}
          onChange={(e) => setArea(e.target.value)}
          maxLength={100}
          placeholder="例：東京都渋谷区"
          required
        />
      </label>

      <div className="form-image">
        <PropertyImage src={shownImage} alt="物件画像のプレビュー" className="preview" />
        <div className="form-image-controls">
          <label>
            画像（JPEG・PNG・WebP・GIF、5MB まで）
            <input type="file" accept={IMAGE_TYPES.join(',')} onChange={handleImageChange} />
          </label>
          {initial?.image_path && !imageFile && (
            <label className="checkbox">
              <input
                type="checkbox"
                checked={removeImage}
                onChange={(e) => setRemoveImage(e.target.checked)}
              />
              登録済みの画像を削除する
            </label>
          )}
        </div>
      </div>

      <label className="checkbox">
        <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
        他のユーザーに公開する（閲覧のみ）
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
