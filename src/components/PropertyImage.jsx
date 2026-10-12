// 物件画像。画像が登録されていなければ「NO IMAGE」を表示する
export default function PropertyImage({ src, alt, className = '' }) {
  if (!src) {
    return (
      <div className={`property-image no-image ${className}`} role="img" aria-label="画像なし">
        NO IMAGE
      </div>
    )
  }
  return <img className={`property-image ${className}`} src={src} alt={alt} loading="lazy" />
}
