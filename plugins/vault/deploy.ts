import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import type { DeployConfig, VaultConfig } from '../../shared/types.ts'
import { flattenNotes, scanSection } from './scan.ts'
import type { VaultStore } from './store.ts'
import { encodePath, resolveInside, toPosix } from './utils.ts'

/**
 * 发布（上云）这件事的落盘逻辑：文本进 content/，图片进 R2。
 *
 * 这里不碰凭证、不发网络请求。它只回答两个问题：
 *   1. content/ 和硬盘上的文本现在差多少？
 *   2. 哪些图片该上传，其中哪些还没传？
 *
 * 这个模块只被 CLI（scripts/publish.ts / sync-content.ts / build-site.ts）使用，
 * 不参与浏览器侧代码——凭证和上传能力都不进前端产物。
 */

/*
 * 上传账本。**这个文件要提交进 git。**
 *
 * 为什么不像最初那样放在 .cache/ 里：静态构建必须能在**没有 D: 盘**的机器上跑
 * （CI、换台电脑），而它需要知道"哪些图在 R2 上、各自的内容哈希是多少"。
 * 图片本身不在仓库里，所以这份账本就是唯一的真相来源：
 *
 *   · publish 写它（上传成功后逐条记 at）
 *   · build 读它（在账本里的图 → 拼 R2 URL + ?v=<sha>；不在的 → 渲染成断链占位）
 *
 * at = 0 表示"已登记但还没真的传上去"（见 publish --registry）。
 */
export const MANIFEST_PATH = 'assets.manifest.json'

/** 一个待上传的对象 */
export interface AssetEntry {
  section: string
  /** section 内相对路径 */
  rel: string
  /** R2 的 key：`<section>/<rel>`，和本地 /@vault/<section>/<rel> 一一对应 */
  key: string
  abs: string
  bytes: number
  mtime: number
}

export interface ManifestObject {
  /** 文件内容的 sha256（十六进制）。既是 R2 的 ?v= 版本号，也是上传时的载荷哈希 */
  sha: string
  size: number
  /** 上传时的源文件 mtime，用来做廉价的「这份变了吗」判断 */
  mtime: number
  /** 上传成功的时间。0 表示只登记了、还没真的传上去 */
  at: number
}

export interface Manifest {
  version: 1
  bucket: string
  /** 记下当时用的对象键前缀。前缀变了等于换了一套 key，所有对象都要重传一遍 */
  prefix: string
  /** 上传时用的公共域名。换了域名要重传（URL 变了），所以记下来做对照 */
  publicBase: string
  updatedAt: number
  /** 当前上传集合里的对象 */
  objects: Record<string, ManifestObject>
  /** 传过、但现在已不在上传集合里的对象（改了配置、或笔记里把图删了） */
  orphans: Record<string, ManifestObject>
  /**
   * 正文里引用了、但源文件根本不存在的图（已知断链）。
   *
   * 为什么要记它：静态构建**没有磁盘访问**（图片不在 content/ 里、也不在仓库里），
   * 所以它分不清"这张图还没上传"和"这个链接本来就是坏的"。不记的话，
   * 那条永远修不好的断链会让构建永远失败——一道传完所有图也过不去的关。
   */
  broken: string[]
}

/** 这条账目代表 R2 上确实有这张图 */
export function isUploaded(entry: ManifestObject | undefined): boolean {
  return !!entry && entry.at > 0
}

export interface R2Credentials {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  publicBase: string
  /** S3 兼容端点：https://<account>.r2.cloudflarestorage.com */
  endpoint: string
}

export interface R2Env {
  credentials: R2Credentials | null
  /** 缺哪些环境变量；为空表示齐了 */
  missing: string[]
  configured: boolean
  bucket: string
  publicBase: string
  envPath: string
}

/* -------------------------------------------------------------------- 环境 */

/**
 * 极简 .env 解析：KEY=VALUE、# 注释、可选的引号。
 *
 * 为什么自己解析而不是靠 Bun/Vite 自动加载：这几个脚本可能通过 `bun run`、也可能
 * 通过 npm 脚本或 CI 被拉起，环境变量的来源不统一；自己读同一个文件，
 * 所有入口看到的就是同一份东西。
 */
export function parseEnvFile(text: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const at = line.indexOf('=')
    if (at <= 0) continue
    const key = line.slice(0, at).trim()
    let value = line.slice(at + 1).trim()
    const quoted =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    if (quoted && value.length >= 2) value = value.slice(1, -1)
    out[key] = value
  }
  return out
}

/**
 * 凭证来源：真实环境变量优先，其次 `.env.local`。
 * 仓库里任何被提交的文件都不含凭证。
 */
export function readR2Env(
  repoRoot: string,
  deployConfig: DeployConfig,
  env: Record<string, string | undefined> = process.env,
): R2Env {
  const envPath = path.join(repoRoot, '.env.local')
  let fromFile: Record<string, string> = {}
  try {
    fromFile = parseEnvFile(fs.readFileSync(envPath, 'utf8'))
  } catch {
    // 没有这个文件是正常状态：还没配 R2 的机器上就该没有
  }

  const pick = (name: string, fallback = ''): string => {
    const value = env[name] ?? fromFile[name] ?? fallback
    return String(value ?? '').trim()
  }

  const bucket = pick('R2_BUCKET', deployConfig.r2.bucket)
  const publicBase = pick('R2_PUBLIC_BASE', deployConfig.r2.publicBase).replace(/\/+$/, '')
  const accountId = pick('R2_ACCOUNT_ID')
  const accessKeyId = pick('R2_ACCESS_KEY_ID')
  const secretAccessKey = pick('R2_SECRET_ACCESS_KEY')

  const missing: string[] = []
  if (!accountId) missing.push('R2_ACCOUNT_ID')
  if (!accessKeyId) missing.push('R2_ACCESS_KEY_ID')
  if (!secretAccessKey) missing.push('R2_SECRET_ACCESS_KEY')

  return {
    credentials:
      missing.length === 0
        ? {
            accountId,
            accessKeyId,
            secretAccessKey,
            bucket,
            publicBase,
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
          }
        : null,
    missing,
    configured: missing.length === 0,
    bucket,
    publicBase,
    envPath,
  }
}

/* ------------------------------------------------------- 上传集合（图片） */

/** 把 `/@vault/<section>/<编码过的相对路径>` 还原成相对路径 */
export function decodeAssetUrl(url: string): string | null {
  const prefix = '/@vault/'
  if (!url.startsWith(prefix)) return null
  const rest = url.slice(prefix.length)
  const at = rest.indexOf('/')
  if (at === -1) return null
  try {
    return rest
      .slice(at + 1)
      .split('/')
      .map(decodeURIComponent)
      .join('/')
  } catch {
    return null
  }
}

/** rel 是否命中某条排除前缀（按目录边界匹配，不做子串包含） */
export function isExcluded(rel: string, prefixes: string[]): boolean {
  for (const raw of prefixes) {
    const p = toPosix(raw).replace(/^\/+|\/+$/g, '')
    if (!p) continue
    if (rel === p || rel.startsWith(`${p}/`)) return true
  }
  return false
}

/**
 * 上传集合 = **笔记正文解析出来的图片引用表**。
 *
 * 关键：这份清单不是"扫一遍猜哪些图有用"，而是和渲染用的是同一个解析结果
 * （store.getNote 的 imageRefs）。所以线上不会出现「这篇笔记少了一张图」——
 * 只要笔记渲染得出来，那张图就一定在清单里；反过来，没人看的图一张都不会传。
 */
export function collectNoteAssets(store: VaultStore, deployConfig: DeployConfig): AssetEntry[] {
  const extensions = new Set(deployConfig.assetExtensions.map((e) => e.toLowerCase()))
  const bucketPrefix = deployConfig.r2.prefix
  const found = new Map<string, AssetEntry>()

  for (const section of store.getIndex().sections) {
    if (section.publish === 'never') continue

    for (const node of flattenNotes(section.children)) {
      const note = store.getNote(section.id, node.path)
      if (!note) continue
      for (const url of Object.values(note.imageRefs)) {
        if (!url) continue
        const rel = decodeAssetUrl(url)
        if (!rel) continue
        if (!extensions.has(path.extname(rel).toLowerCase())) continue
        if (isExcluded(rel, deployConfig.assetExclude)) continue
        const key = assetKey(bucketPrefix, section.id, rel)
        if (found.has(key)) continue
        const abs = resolveInside(section.root, rel)
        if (!abs) continue
        let stat: fs.Stats
        try {
          stat = fs.statSync(abs)
        } catch {
          continue
        }
        found.set(key, { section: section.id, rel, key, abs, bytes: stat.size, mtime: stat.mtimeMs })
      }
    }
  }

  return [...found.values()].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
}

/**
 * 拼公开访问的 URL。带 ?v= 才能安心用 immutable 缓存：图换了，URL 也跟着换。
 *
 * key 是完整的桶内键（含前缀），因为公开域名直接映射到桶：
 * `https://cdn.example.com/MioNote/soft-exam/img/x.png?v=abcd1234`
 */
export function publicUrl(publicBase: string, key: string, sha?: string): string {
  const base = publicBase.replace(/\/+$/, '')
  const url = `${base}/${encodePath(key)}`
  return sha ? `${url}?v=${sha.slice(0, 8)}` : url
}

/* ---------------------------------------------------- content/ 同步（文本） */

export interface ContentFile {
  section: string
  rel: string
  srcAbs: string
  size: number
  mtime: number
}

export interface ContentPlan {
  contentRoot: string
  files: ContentFile[]
  expectedBytes: number
  /** content/ 里现有的文件（`<section>/<rel>`） */
  presentKeys: Set<string>
  pending: Array<{ section: string; rel: string; reason: 'missing' | 'stale' }>
  extra: string[]
}

/**
 * 文本要提交进仓库的那一份，和硬盘上现在的内容差多少。
 *
 * 复用 scanSection 而不是自己遍历：app 索引哪些文件、快照里就有哪些文件，
 * 两边的 ignore 规则（README、node_modules、bin…）因此不会分叉。
 */
export function planContent(
  config: VaultConfig,
  deployConfig: DeployConfig,
  repoRoot: string,
): ContentPlan {
  const contentRoot = path.join(repoRoot, deployConfig.contentDir)
  const skip = new Set(deployConfig.contentSkipFiles)
  const files: ContentFile[] = []

  for (const section of config.sections) {
    if (section.publish === 'never') continue
    const scan = scanSection(config, section)
    if (!scan.available) continue
    for (const file of [...scan.notes, ...scan.demos, ...scan.codes]) {
      if (skip.has(file.name)) continue
      files.push({
        section: section.id,
        rel: file.rel,
        srcAbs: file.abs,
        size: file.size,
        mtime: file.mtime,
      })
    }
  }

  const presentKeys = new Set(walkFiles(contentRoot))
  const expectedKeys = new Set<string>()
  const pending: ContentPlan['pending'] = []
  let expectedBytes = 0

  for (const file of files) {
    const key = `${file.section}/${file.rel}`
    expectedKeys.add(key)
    expectedBytes += file.size

    const dest = path.join(contentRoot, file.section, ...file.rel.split('/'))
    let stat: fs.Stats
    try {
      stat = fs.statSync(dest)
    } catch {
      pending.push({ section: file.section, rel: file.rel, reason: 'missing' })
      continue
    }
    /*
     * 精确相等，而不是"快照比源文件旧"。
     *
     * 拷贝时我们会把源文件的 mtime 一起写过去（见 applyContent），所以"同步过"这件事
     * 等价于两边的 mtime 和大小都相同。用 `<` 判断会漏掉一种情况：你把笔记回退到旧版本时
     * mtime 往回调、大小又恰好一样，就会被误判成"已同步"——而"快照是不是最新的"
     * 这个判断一旦会撒谎，发布流程就不可信了。
     * 容差 1ms 是给文件系统的时间戳精度留的余量。
     */
    if (stat.size !== file.size || Math.abs(stat.mtimeMs - file.mtime) > 1) {
      pending.push({ section: file.section, rel: file.rel, reason: 'stale' })
    }
  }

  return {
    contentRoot,
    files,
    expectedBytes,
    presentKeys,
    pending: pending.sort((a, b) => (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0)),
    extra: [...presentKeys].filter((key) => !expectedKeys.has(key)).sort(),
  }
}

/** 执行同步：补上缺的、覆盖旧的、删掉源文件夹里已经没有的 */
export function applyContent(plan: ContentPlan): { written: number; deleted: number; bytes: number } {
  let written = 0
  let bytes = 0

  for (const item of plan.pending) {
    const file = plan.files.find((f) => f.section === item.section && f.rel === item.rel)
    if (!file) continue
    const dest = path.join(plan.contentRoot, file.section, ...file.rel.split('/'))
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.copyFileSync(file.srcAbs, dest)
    // 把源的 mtime 也写过去：这样 planContent 才能用"严格相等"判断同步状态，
    // 而不用去猜（回退版本的那条路径也才对得上）
    const seconds = file.mtime / 1000
    fs.utimesSync(dest, seconds, seconds)
    written += 1
    bytes += file.size
  }

  let deleted = 0
  for (const key of plan.extra) {
    const dest = path.join(plan.contentRoot, ...key.split('/'))
    try {
      fs.rmSync(dest)
      deleted += 1
    } catch {
      // 删不掉就算了，下次同步还会看到它
    }
  }

  return { written, deleted, bytes }
}

/** 递归列出目录下所有文件，返回相对 root 的 posix 路径 */
export function walkFiles(root: string, base = ''): string[] {
  const out: string[] = []
  const stack: string[] = [base]
  while (stack.length > 0) {
    const relDir = stack.pop() as string
    const absDir = relDir ? path.join(root, relDir) : root
    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(absDir, { withFileTypes: true })
    } catch {
      continue
    }
    for (const entry of entries) {
      const child = relDir ? `${relDir}/${entry.name}` : entry.name
      if (entry.isDirectory()) stack.push(child)
      else if (entry.isFile()) out.push(toPosix(child))
    }
  }
  return out
}

/* ------------------------------------------------------------ manifest 账本 */

export function readManifest(repoRoot: string): Manifest | null {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(repoRoot, MANIFEST_PATH), 'utf8')) as Manifest
    if (raw?.version !== 1 || typeof raw.objects !== 'object') return null
    if (!raw.orphans) raw.orphans = {}
    if (!raw.publicBase) raw.publicBase = ''
    if (typeof raw.prefix !== 'string') raw.prefix = ''
    if (!Array.isArray(raw.broken)) raw.broken = []
    return raw
  } catch {
    return null
  }
}

export function writeManifest(repoRoot: string, manifest: Manifest): void {
  const abs = path.join(repoRoot, MANIFEST_PATH)
  fs.mkdirSync(path.dirname(abs), { recursive: true })
  fs.writeFileSync(abs, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
}

/** sha256。387 MB 全量算一遍是秒级的，所以 CLI 每张都算，不做 mtime 猜测 */
export function hashFile(abs: string): string {
  return createHash('sha256').update(fs.readFileSync(abs)).digest('hex')
}

/**
 * 带缓存的 sha256，只在 publish 里用（它要逐张算哈希来和账本比对）。
 * 静态构建不用它——构建手上没有图片文件，sha 从账本里读。
 */
const shaCache = new Map<string, { mtimeMs: number; size: number; sha: string }>()

export function cachedSha(abs: string): string {
  let stat: fs.Stats
  try {
    stat = fs.statSync(abs)
  } catch {
    return ''
  }
  const hit = shaCache.get(abs)
  if (hit && hit.mtimeMs === stat.mtimeMs && hit.size === stat.size) return hit.sha
  const sha = hashFile(abs)
  shaCache.set(abs, { mtimeMs: stat.mtimeMs, size: stat.size, sha })
  return sha
}

/**
 * R2 的对象键：`<前缀>/<section>/<笔记内相对路径>`，比如 `MioNote/soft-exam/img/x.png`。
 *
 * 上传、对账、拼公开 URL **三处都用它，只在这里定义一次**——这三处一旦分叉，
 * 结果就是构建产出的图片地址指向一个桶里根本不存在的 key，而且很难看出来。
 *
 * 前缀来自 `deploy.r2.prefix`（桶里的"文件夹"）。传空字符串就是直接放桶根。
 */
export function assetKey(prefix: string, sectionId: string, rel: string): string {
  const clean = prefix.replace(/^\/+|\/+$/g, '')
  return clean ? `${clean}/${sectionId}/${rel}` : `${sectionId}/${rel}`
}

/** 显示用：`file-bucket/MioNote/`。CLI 报告里让"东西放哪"一眼可见。 */
export function bucketLabel(bucket: string, prefix: string): string {
  const clean = prefix.replace(/^\/+|\/+$/g, '')
  return clean ? `${bucket}/${clean}/` : `${bucket}/`
}
