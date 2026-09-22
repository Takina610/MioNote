export type Route =
  | { kind: 'home' }
  | { kind: 'note'; sectionId: string; path: string }
  | { kind: 'demo'; sectionId: string; path: string }
  | { kind: 'code'; sectionId: string; path: string }

/**
 * 用 hash 路由而不是 history 路由，原因很实际：
 * 这份代码将来要丢进 Tauri 的 webview 和 Cloudflare 的静态托管里直接跑，
 * hash 路由不需要任何服务端 rewrite 规则配合，换环境零配置。
 * 顺带好处是本地双击也能用、刷新不丢位置。
 */
export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#\/?/, '')
  if (!raw) return { kind: 'home' }

  const parts = raw.split('/')
  const head = parts.shift()
  const sectionId = parts.shift() ?? ''

  let path = ''
  try {
    path = parts.map(decodeURIComponent).join('/')
  } catch {
    path = parts.join('/')
  }

  if (!sectionId || !path) return { kind: 'home' }
  if (head === 'n') return { kind: 'note', sectionId, path }
  if (head === 'd') return { kind: 'demo', sectionId, path }
  if (head === 'c') return { kind: 'code', sectionId, path }
  return { kind: 'home' }
}

export function toHash(route: Route): string {
  if (route.kind === 'home') return '#/'
  const prefix = route.kind === 'note' ? 'n' : route.kind === 'demo' ? 'd' : 'c'
  const path = route.path.split('/').map(encodeURIComponent).join('/')
  return `#/${prefix}/${encodeURIComponent(route.sectionId)}/${path}`
}

/** 同一个路由。hashchange 会为一个路由来两趟（见 navigate），靠它去重 */
export function sameRoute(a: Route, b: Route): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'home' || b.kind === 'home') return a.kind === b.kind
  return a.sectionId === b.sectionId && a.path === b.path
}

type RouteListener = (route: Route) => void

const listeners = new Set<RouteListener>()

/**
 * 订阅路由变化。
 *
 * navigate() 会**同步**通知订户，不等浏览器的 hashchange（那是任务级异步的）。
 * 页面过渡需要「点击 → DOM 换成新路由」发生在同一帧里，否则浏览器拍到的新快照
 * 还是旧那一页，过渡就是空的。
 */
export function subscribeRoute(listener: RouteListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function navigate(route: Route): void {
  const next = toHash(route)
  if (window.location.hash === next) return
  window.location.hash = next
  for (const listener of listeners) listener(route)
}
