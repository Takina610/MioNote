import { useCallback, useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { usePersistentState } from './usePersistentState'

export type ThemeChoice = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

const QUERY = '(prefers-color-scheme: dark)'

function systemTheme(): ResolvedTheme {
  return window.matchMedia(QUERY).matches ? 'dark' : 'light'
}

function apply(theme: ResolvedTheme): void {
  document.documentElement.dataset.theme = theme
  // 让原生控件（滚动条、表单）也跟着切换
  document.documentElement.style.colorScheme = theme
}

export interface ThemeState {
  isDark: boolean
  /** 点按钮时用：传事件是为了知道圆形扩散从哪里长出来 */
  toggle: (event?: { clientX: number; clientY: number }) => void
}

/**
 * 主题状态 + 切换动画。
 *
 * 动画照搬 DigitalComInteOpHub/frontend（vben-admin）的 ThemeToggle：点击处长出一个圆，
 * 圆心是鼠标、半径算到最远的屏幕角，整屏换色只用一次 clip-path 动画完成。
 * 它靠 View Transitions API —— 换主题时浏览器给页面拍「旧/新」两张快照，
 * 我们把默认的交叉淡入淡出换成"从点击处铺开"。
 *
 * 三个必须照着搬的细节，缺一个动画就是坏的：
 *
 *   1. **`flushSync`**：React 的 setState 是异步批处理的，而 startViewTransition 的回调
 *      必须**在它返回之前**把 DOM 改成最终状态，否则浏览器拍到的新快照还是旧主题。
 *      顺带把颜色写在 documentElement 上（dataset + color-scheme），和 setState 一起提交。
 *   2. **动哪一层取决于方向**：变深色时动 `::view-transition-old(root)`，变浅色时动
 *      `::view-transition-new(root)`；谁盖在谁上面由 CSS 里的 z-index 决定（见 app.css）。
 *   3. `prefers-reduced-motion` 下不做过渡；不支持 View Transitions 的浏览器
 *      （Firefox）走同一条退化路径——直接切换，功能不受影响。
 *
 * 主题只有明暗两态，没有「跟随系统」这一档可选项（用户要求去掉）：首次打开时默认跟着系统
 * 走，点一下按钮就固定成浅色或深色——之后系统换主题不再影响它。
 */
export function useTheme(): ThemeState {
  const [choice, setChoice] = usePersistentState<ThemeChoice>('mionote:theme', 'system')
  const [system, setSystem] = useState<ResolvedTheme>(systemTheme)

  useEffect(() => {
    const media = window.matchMedia(QUERY)
    const onChange = () => setSystem(media.matches ? 'dark' : 'light')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const resolved: ResolvedTheme = choice === 'system' ? system : choice

  useEffect(() => {
    apply(resolved)
  }, [resolved])

  /** 换主题就是这两件事一起做：改 DOM 上的颜色 + 记住选择 */
  const commit = useCallback(
    (next: ResolvedTheme) => {
      apply(next)
      setChoice(next)
    },
    [setChoice],
  )

  const toggle = useCallback(
    (event?: { clientX: number; clientY: number }) => {
      const next: ResolvedTheme = resolved === 'dark' ? 'light' : 'dark'
      const startTransition = document.startViewTransition?.bind(document)
      const animated =
        !!startTransition &&
        !!event &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (!animated) {
        commit(next)
        return
      }

      const x = event.clientX
      const y = event.clientY
      const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))

      const transition = startTransition(() => {
        flushSync(() => commit(next))
      })

      transition.ready
        .then(() => {
          const clipPath = [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ]
          const picture = document.documentElement.animate(
            // 变深色：旧画面（浅色）从满屏缩回点击处，露出底下的新画面
            { clipPath: next === 'dark' ? clipPath.toReversed() : clipPath },
            {
              duration: 450,
              easing: 'ease-in',
              pseudoElement:
                next === 'dark' ? '::view-transition-old(root)' : '::view-transition-new(root)',
            },
          )
          picture.onfinish = () => transition.skipTransition()
        })
        // 连续点两次时浏览器会跳掉上一次过渡，ready 随之 reject。那不是错误，
        // 只是这次动画没机会播——不接住它会在控制台留下一条未处理的拒绝。
        .catch(() => {})
    },
    [commit, resolved],
  )

  return { isDark: resolved === 'dark', toggle }
}
