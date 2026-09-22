import type { MouseEvent } from 'react'

interface ThemeToggleProps {
  isDark: boolean
  onToggle: (event: MouseEvent<HTMLButtonElement>) => void
}

/**
 * 深暗色切换按钮：一个太阳/月亮，点击时从鼠标位置把新主题铺满整屏（见 useTheme）。
 *
 * 图标动画与按钮结构照搬 DigitalComInteOpHub/frontend 的 theme-button.vue：
 * 太阳是个圆，被一个可移动的黑色小圆（SVG mask）啃掉一块就成了月亮；
 * 换主题时 mask 圆滑走/滑回，太阳缩小再长回来，光芒转半圈。
 *
 * 图标画的是"点下去会变成什么"：现在是浅色 → 显示月亮。没有下拉菜单，
 * 点一下就是明暗互换（悬浮菜单里的三档预置去掉了：这个按钮只该做一件事）。
 */
export function ThemeToggle({ isDark, onToggle }: ThemeToggleProps) {
  const label = isDark ? '深色' : '浅色'
  const next = isDark ? 'light' : 'dark'

  return (
    <button
      type="button"
      className={`icon-btn theme-toggle is-${next}`}
      title={`主题：${label}（点击切换）`}
      aria-label={`主题：${label}，点击切换`}
      aria-live="polite"
      onClick={onToggle}
    >
      <svg width={17} height={17} viewBox="0 0 24 24" aria-hidden="true">
        <mask id="mionote-theme-moon" className="theme-toggle__moon">
          <rect fill="white" height="100%" width="100%" x="0" y="0" />
          <circle cx="40" cy="8" fill="black" r="11" />
        </mask>
        <circle className="theme-toggle__sun" cx="12" cy="12" mask="url(#mionote-theme-moon)" r="11" />
        <g className="theme-toggle__sun-beams" strokeWidth={2} strokeLinecap="round">
          <line x1="12" x2="12" y1="1" y2="3" />
          <line x1="12" x2="12" y1="21" y2="23" />
          <line x1="4.22" x2="5.64" y1="4.22" y2="5.64" />
          <line x1="18.36" x2="19.78" y1="18.36" y2="19.78" />
          <line x1="1" x2="3" y1="12" y2="12" />
          <line x1="21" x2="23" y1="12" y2="12" />
          <line x1="4.22" x2="5.64" y1="19.78" y2="18.36" />
          <line x1="18.36" x2="19.78" y1="5.64" y2="4.22" />
        </g>
      </svg>
    </button>
  )
}
