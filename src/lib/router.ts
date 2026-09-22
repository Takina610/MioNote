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

export function navigate(route: Route): void {
  const next = toHash(route)
  if (window.location.hash === next) return
  window.location.hash = next
}
