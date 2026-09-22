import { flushSync } from 'react-dom'
import { navigate, type Route } from './router'

export type NavDirection = 'prev' | 'next'

let sequence = 0
let running = false

/** 页面过渡正在播的时候，别的 View Transition（换主题）先让路，理由见下面那条注释 */
export function isPageTransitionRunning(): boolean {
  return running
}

/**
 * 「上一篇 / 下一篇」的跳转：换页时给整页拍新旧两张快照，把默认的交叉淡入淡出
 * 换成方向化的滑动——下一篇从右边推进来，上一篇从左边，跟按钮的箭头一致。
 *
 * 几处不能省的地方：
 *
 *   1. **名字只在过渡期间存在**。`data-nav` 一置上，CSS 才给正文列和目录列起
 *      `view-transition-name`；名字必须全局唯一，而换主题那套拍的是整页快照——
 *      正文列一旦有名字，就会被排除在圆形裁剪之外，圆会缺一块。所以这 220ms
 *      之外它俩都是无名元素。
 *   2. **flushSync**：React 的 setState 是批处理的，而 View Transition 要求回调
 *      返回前 DOM 已经是新状态（跟换主题同一个坑，见 useTheme）。
 *   3. `sequence` 那个号：连点两下时浏览器会跳掉上一次过渡，被跳掉的那次
 *      finished 立刻结算——没有号的话它会把还在跑的那次的名字一起清掉。
 *   4. 不支持 View Transitions（Firefox 老版本）或系统要求减少动态效果时直接跳转，
 *      功能一点不少，只是没有动画。
 */
export function navigateStep(route: Route, direction: NavDirection): void {
  const root = document.documentElement
  const startTransition = document.startViewTransition?.bind(document)
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!startTransition || reduced) {
    navigate(route)
    return
  }

  const token = ++sequence
  running = true
  root.dataset.nav = direction

  const transition = startTransition(() => {
    flushSync(() => navigate(route))
  })

  const done = () => {
    if (token !== sequence) return
    running = false
    delete root.dataset.nav
  }
  transition.finished.then(done, done)
}
