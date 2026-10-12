import { useState } from 'react'

// 物件一覧の表示形式（tile: タイル / list: 一覧）
// ブラウザの localStorage に保存するので、ログアウト・再読み込み後も維持される
const STORAGE_KEY = 'realestate-app:viewMode'
const VIEW_MODES = ['tile', 'list']

function loadViewMode() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return VIEW_MODES.includes(saved) ? saved : 'tile'
  } catch {
    return 'tile'
  }
}

export function useViewMode() {
  const [viewMode, setViewModeState] = useState(loadViewMode)

  function setViewMode(mode) {
    setViewModeState(mode)
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      // 保存できない環境（プライベートモードなど）では、この画面の間だけ切り替える
    }
  }

  return [viewMode, setViewMode]
}
