import path from 'node:path'

/**
 * 微软雅黑式的排序：`10-` 排在 `2-` 后面，而不是字典序。
 * 中日文按读音/笔画交给 Intl 处理，中文乱序总好过数字全乱。
 */
const collator = new Intl.Collator('zh-Hans-CN', {
  numeric: true,
  sensitivity: 'base',
})

export function naturalCompare(a: string, b: string): number {
  const byName = collator.compare(a, b)
  if (byName !== 0) return byName
  // 同名时退化成字节序，保证结果稳定（否则每次扫描顺序可能不一样）
  return a < b ? -1 : a > b ? 1 : 0
}

/** 把 Windows 的反斜杠统一成 /，方便进 URL 和 JSON */
export function toPosix(p: string): string {
  return p.split(path.sep).join('/').replace(/\\/g, '/')
}

/** 逐段编码。整串 encodeURIComponent 会把 / 也编掉。 */
export function encodePath(relPath: string): string {
  return relPath.split('/').map(encodeURIComponent).join('/')
}

/** 生成 /@vault/... 形式的可访问 URL，浏览器和 iframe 都吃这个 */
export function assetUrl(sectionId: string, relPath: string): string {
  return `/@vault/${sectionId}/${encodePath(relPath)}`
}

export function apiUrl(
  endpoint: string,
  params: Record<string, string | undefined>,
): string {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) qs.set(k, v)
  }
  const s = qs.toString()
  return `/api/${endpoint}${s ? `?${s}` : ''}`
}

/**
 * 解析正文里的相对图片引用。
 * 返回 section 内的相对路径；返回 null 表示它不是本地文件引用，不该我们管。
 */
export function normalizeAssetRef(src: string): string | null {
  const s = src.trim()
  if (!s) return null
  if (/^(https?:|data:|blob:|mailto:|tel:|file:|#|\/\/)/i.test(s)) return null
  // `<img src="x.png">` 和部分编辑器会带上奇怪的引号
  const unquoted = s.replace(/^['"]|['"]$/g, '')
  let decoded = unquoted
  try {
    decoded = decodeURIComponent(unquoted)
  } catch {
    // 原文里有非法的 % 转义，就当没编码过
  }
  return toPosix(decoded).replace(/^\.\//, '')
}

/** 把 section 内的相对引用解析成绝对路径，并确保没跑出根目录 */
export function resolveInside(
  root: string,
  relPath: string,
): string | null {
  const abs = path.resolve(root, relPath)
  const rel = path.relative(root, abs)
  if (rel.startsWith('..') || path.isAbsolute(rel)) return null
  return abs
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf',
  '.wasm': 'application/wasm',
  '.zip': 'application/zip',
  '.dpg': 'application/octet-stream',
}

export function contentType(filePath: string): string {
  return MIME[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream'
}

/** 目录名里常见的前缀编号，留着显示，但要能自然排序 */
export function stripLeadingNumber(name: string): string {
  return name.replace(/^\d+[-_.\s]+/, '')
}

/** 去掉扩展名，得到人类可读的标题 */
export function baseTitle(name: string): string {
  return name.replace(/\.[^.]+$/, '')
}

export function humanBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

/**
 * 找出 HTML 里引用的外部域名。
 * 只看 http(s) 和协议相对地址——相对路径指的是本地文件，不算外部依赖。
 */
export function extractExternalHosts(html: string): string[] {
  const hosts = new Set<string>()
  const re = /(?:https?:)?\/\/([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const host = m[1].toLowerCase()
    if (host === 'localhost' || host.endsWith('.localhost')) continue
    hosts.add(host)
    if (hosts.size >= 12) break
  }
  return [...hosts].sort()
}
