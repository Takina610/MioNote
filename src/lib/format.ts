export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

export function formatDate(ms: number): string {
  if (!ms) return '未知'
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function formatRelative(ms: number): string {
  if (!ms) return ''
  const diff = Date.now() - ms
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  if (diff < 30 * day) return `${Math.floor(diff / day)} 天前`
  return formatDate(ms)
}

/** 从 section 内相对路径里取出目录部分，用来做面包屑 */
export function parentPath(rel: string): string {
  const at = rel.lastIndexOf('/')
  return at === -1 ? '' : rel.slice(0, at)
}

export function fileName(rel: string): string {
  const at = rel.lastIndexOf('/')
  return at === -1 ? rel : rel.slice(at + 1)
}

/** 在 section 内相对路径的每一层上累积出可点击的层级 */
export function breadcrumb(rel: string): Array<{ name: string; path: string }> {
  const parts = rel.split('/')
  const out: Array<{ name: string; path: string }> = []
  let acc = ''
  for (const part of parts.slice(0, -1)) {
    acc = acc ? `${acc}/${part}` : part
    out.push({ name: part, path: acc })
  }
  return out
}
