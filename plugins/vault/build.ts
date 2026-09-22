import fs from 'node:fs'
import path from 'node:path'
import type {
  DeployConfig,
  VaultConfig,
  VaultIndex,
  VaultNode,
} from '../../shared/types.ts'
import { assetKey, isUploaded, publicUrl, readManifest } from './deploy.ts'
import { VaultStore } from './store.ts'
import { humanBytes } from './utils.ts'

/**
 * 静态站生成器：把 `content/` 快照编译成能直接丢给静态托管的一坨文件。
 *
 * 它是「上云」那件事的最后一块：在 `vite build` 之后往 `dist/` 里补三样东西——
 *
 *   dist/api/vault.json              索引（树 + 统计 + 断链报告）
 *   dist/api/search-index.json       全文搜索用的正文
 *   dist/api/note/**、demo/**        每篇笔记 / 每个 demo 的 payload
 *   dist/@vault/**                   文本原样拷贝，给「看源码」用
 *
 * 两个关键性质：
 *
 * 1. **构建读的是 `content/`，不是 D: 盘。** 所以 CI 或换台电脑都能构建；
 *    要发布的内容必须先进快照（`bun run sync`）。
 * 2. **图片 URL 在这里被换成 R2 域名。** 本地 dev 仍然是 `/@vault/...` 读磁盘——
 *    所以你的写作手感不变，而线上多了一个 `?v=<内容哈希>` 的版本号，图换了缓存会自动失效。
 *
 * fail-closed 在这里的体现：只有 `publish: 'public'` 的文件夹会进产物。
 * `never` 不生成任何文件；`private` 也排除（鉴权还没实现，上云等于公开泄露），并明确报出来。
 */
export interface SiteSectionReport {
  id: string
  name: string
  notes: number
  demos: number
  /** 源码文件（.js/.css/.vue…）：线上只能读，但和 demo 一样要出现在树里 */
  codes: number
  textFiles: number
  bytes: number
}

export interface SiteReport {
  outDir: string
  publicBase: string
  sections: SiteSectionReport[]
  notes: number
  demos: number
  apiFiles: number
  apiBytes: number
  textFiles: number
  textBytes: number
  /** 正文引用到的图片张数 */
  images: number
  /** 引用了、但 manifest 里还没有的图（= 还没上传到 R2）。线上会缺这些图 */
  missingUploads: string[]
  /** 源文件本来就不存在的引用（已知断链）。渲染成占位，不是构建的错 */
  brokenRefs: string[]
  /** content/ 里有、但按配置不该发布的文件夹（出现了就说明哪里不对） */
  strayDirs: string[]
  /** 被排除的 private 文件夹 */
  excludedPrivate: string[]
  /** 本机绝对路径有没有被写进产物 */
  leakedPaths: string[]
}

function writeJson(abs: string, data: unknown): number {
  fs.mkdirSync(path.dirname(abs), { recursive: true })
  const text = JSON.stringify(data)
  fs.writeFileSync(abs, text, 'utf8')
  return Buffer.byteLength(text, 'utf8')
}

function collectNodes(
  nodes: VaultNode[],
  out: { notes: VaultNode[]; demos: VaultNode[]; codes: VaultNode[] },
): void {
  for (const node of nodes) {
    if (node.kind === 'folder') collectNodes(node.children ?? [], out)
    else if (node.kind === 'note') out.notes.push(node)
    else if (node.kind === 'demo') out.demos.push(node)
    else out.codes.push(node)
  }
}

/** 递归统计一个目录的文件数与字节数 */
function measureDir(root: string): { files: number; bytes: number } {
  let files = 0
  let bytes = 0
  const stack = ['']
  while (stack.length > 0) {
    const rel = stack.pop() as string
    const abs = rel ? path.join(root, rel) : root
    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(abs, { withFileTypes: true })
    } catch {
      continue
    }
    for (const entry of entries) {
      const child = rel ? `${rel}/${entry.name}` : entry.name
      if (entry.isDirectory()) stack.push(child)
      else if (entry.isFile()) {
        files += 1
        try {
          bytes += fs.statSync(path.join(root, child)).size
        } catch {
          // 读不到就当 0，不影响别的文件
        }
      }
    }
  }
  return { files, bytes }
}

export function buildStaticSite(
  config: VaultConfig,
  deployConfig: DeployConfig,
  repoRoot: string,
  outDir: string,
  options: { publicBase: string },
): SiteReport {
  const publicBase = options.publicBase.replace(/\/+$/, '')
  if (!publicBase) {
    throw new Error('缺少 R2 公共域名：图片会指向不存在的地址。请在 .env.local 里配 R2_PUBLIC_BASE')
  }

  const contentRoot = path.join(repoRoot, deployConfig.contentDir)
  if (!fs.existsSync(contentRoot)) {
    throw new Error(`没有内容快照：${contentRoot}。先跑 bun run sync`)
  }

  const publishable = config.sections.filter((s) => s.publish === 'public')
  const excludedPrivate = config.sections.filter((s) => s.publish === 'private').map((s) => s.name)

  // content/ 里出现不该发布的文件夹 = 上游哪里错了。不复制它，但要报出来
  const strayDirs = fs
    .readdirSync(contentRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !publishable.some((s) => s.id === entry.name))
    .map((entry) => entry.name)

  // 构建用的配置：把根目录指向 content/ 快照，而不是 D: 盘。
  // 于是扫描、解析、切分小节、算上一篇下一篇——全部逻辑原样复用，一行都不用改。
  const buildConfig: VaultConfig = {
    ...config,
    sections: publishable.map((section) => ({
      ...section,
      root: path.join(contentRoot, section.id),
    })),
  }

  // 上传账本：构建时**图片不在磁盘上**（content/ 只装文本），所以哪些图存在、
  // 各自的哈希是多少，全凭这份提交进仓库的账本。查不到就是断链。
  const manifest = readManifest(repoRoot)
  const registry = manifest?.objects ?? {}
  const knownBroken = new Set(manifest?.broken ?? [])

  /**
   * 正文引用到的图片分三类：
   *   uploaded —— 账本里有、也传上去了：拼得出 URL
   *   pending  —— 该有但还没有（没登记、或登记了没上传）：线上缺图，构建该失败
   *   broken   —— 源文件本来就不存在（账本记着）：渲染成占位，不算构建的错
   * 最后一类必须和 pending 分开，否则那条永远修不好的断链会让构建永远过不去。
   */
  type AssetState = 'uploaded' | 'pending' | 'broken'
  const referenced = new Map<string, AssetState>()

  const store = new VaultStore(buildConfig, {
    assetLookup: 'registry',
    assetUrlFor: ({ sectionId, rel }) => {
      const key = assetKey(deployConfig.r2.prefix, sectionId, rel)
      const entry = registry[key]
      if (!entry) {
        referenced.set(key, knownBroken.has(key) ? 'broken' : 'pending')
        return null
      }
      const ready = isUploaded(entry)
      referenced.set(key, ready ? 'uploaded' : 'pending')
      return publicUrl(publicBase, key, entry.sha)
    },
    demoRunnable: false,
  })

  const apiDir = path.join(outDir, 'api')
  const vaultDir = path.join(outDir, '@vault')
  fs.mkdirSync(apiDir, { recursive: true })
  fs.mkdirSync(vaultDir, { recursive: true })

  let apiFiles = 0
  let apiBytes = 0
  const addApi = (abs: string, data: unknown) => {
    apiBytes += writeJson(abs, data)
    apiFiles += 1
  }

  const index = store.getIndex()

  /*
   * 索引里的 root 是本机绝对路径（dev 面板要显示它，方便你确认读的是哪个文件夹）。
   * 线上不该带着 D:\WorkCodeLearning\... 出门，所以换成仓库内的相对路径——
   * 既没有本地信息，又如实说明"这份内容来自 content/<id>"。
   */
  const publicIndex: VaultIndex = {
    ...index,
    sections: index.sections.map((section) => ({
      ...section,
      root: `${deployConfig.contentDir}/${section.id}`,
    })),
  }
  addApi(path.join(apiDir, 'vault.json'), publicIndex)
  addApi(path.join(apiDir, 'search-index.json'), store.getSearchIndex())

  const sections: SiteSectionReport[] = []
  let noteCount = 0
  let demoCount = 0

  for (const section of index.sections) {
    const nodes = { notes: [] as VaultNode[], demos: [] as VaultNode[], codes: [] as VaultNode[] }
    collectNodes(section.children, nodes)

    for (const node of nodes.notes) {
      const note = store.getNote(section.id, node.path)
      if (!note) continue
      // 文件名带 .md，再加 .json 会变成 `xxx.md.json`——丑但无歧义，
      // 而且比"把扩展名换掉"安全（换掉可能撞名）
      addApi(path.join(apiDir, 'note', section.id, `${node.path}.json`), note)
      noteCount += 1
    }

    for (const node of nodes.demos) {
      const demo = store.getDemo(section.id, node.path)
      if (!demo) continue
      addApi(path.join(apiDir, 'demo', section.id, `${node.path}.json`), demo)
      demoCount += 1
    }

    // 文本原样拷贝：demo 的「看源码」直接按 /@vault/ 路径取文件，
    // 所以线上和本地的路径前缀完全一致，客户端不需要知道自己在哪个环境
    const from = path.join(contentRoot, section.id)
    const to = path.join(vaultDir, section.id)
    const measured = fs.existsSync(from) ? measureDir(from) : { files: 0, bytes: 0 }
    if (fs.existsSync(from)) fs.cpSync(from, to, { recursive: true })

    sections.push({
      id: section.id,
      name: section.name,
      notes: nodes.notes.length,
      demos: nodes.demos.length,
      codes: nodes.codes.length,
      textFiles: measured.files,
      bytes: measured.bytes,
    })
  }

  const missingUploads = [...referenced.entries()]
    .filter(([, state]) => state === 'pending')
    .map(([key]) => key)
    .sort()
  const brokenRefs = [...referenced.entries()]
    .filter(([, state]) => state === 'broken')
    .map(([key]) => key)
    .sort()

  /*
   * 产物自检：确认没有本机路径、也没有该保密的文件夹名漏出去。
   *
   * 用**精确字符串匹配我们自己知道的路径**，而不是"看起来像 Windows 路径"的正则——
   * 后者会误报：笔记正文里到处都是 `https://cdn.jsdelivr.net/...`（`s://` 撞上盘符模式）
   * 和用户自己写的 `e:/path（上传）`。自检要是会误报，就会被人忽略，那还不如没有。
   */
  const secretStrings: string[] = [
    ...config.sections.map((s) => s.root),
    repoRoot,
  ].filter((value) => value && value.length > 3)

  const leakedPaths: string[] = []
  const scanForLeaks = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        scanForLeaks(abs)
        continue
      }
      if (!entry.name.endsWith('.json')) continue
      const text = fs.readFileSync(abs, 'utf8')
      for (const secret of secretStrings) {
        if (text.includes(secret) || text.includes(secret.split('\\').join('/'))) {
          leakedPaths.push(`${path.relative(outDir, abs)} 含本机路径 ${secret}`)
        }
      }
    }
  }
  scanForLeaks(apiDir)

  // 结构检查：产物里不该有任何非 public 的文件夹（比字符串匹配可靠）
  const badSections = publicIndex.sections.filter((s) => s.publish !== 'public')
  for (const section of badSections) {
    leakedPaths.push(`api/vault.json 里有 publish=${section.publish} 的文件夹 ${section.id}`)
  }

  return {
    outDir,
    publicBase,
    sections,
    notes: noteCount,
    demos: demoCount,
    apiFiles,
    apiBytes,
    textFiles: sections.reduce((sum, s) => sum + s.textFiles, 0),
    textBytes: sections.reduce((sum, s) => sum + s.bytes, 0),
    images: referenced.size,
    missingUploads,
    brokenRefs,
    strayDirs,
    excludedPrivate,
    leakedPaths,
  }
}

/** 打印构建报告。返回是否需要让构建失败（有硬问题）。 */
export function printSiteReport(report: SiteReport, options: { allowMissingAssets: boolean }): boolean {
  const line = (label: string, value: string) => console.log(`  ${label.padEnd(10)}${value}`)

  console.log('')
  console.log('  MioNote · 静态站已生成')
  console.log('  ──────────────────────────────────────────────')
  line('产物', `${path.relative(process.cwd(), report.outDir).split(path.sep).join('/')}/`)
  line('图片指向', report.publicBase)
  console.log('')
  for (const section of report.sections) {
    console.log(
      `    ${section.name.padEnd(10)} 笔记 ${String(section.notes).padStart(3)} · demo ${String(
        section.demos,
      ).padStart(3)} · 源码 ${String(section.codes).padStart(4)} · 文本 ${String(
        section.textFiles,
      ).padStart(4)} 个 ${humanBytes(section.bytes).padStart(8)}`,
    )
  }
  console.log('')
  line('接口数据', `${report.apiFiles} 个 JSON / ${humanBytes(report.apiBytes)}`)
  line('文本拷贝', `${report.textFiles} 个 / ${humanBytes(report.textBytes)}`)
  line('引用图片', `${report.images} 张`)

  let fatal = false

  if (report.excludedPrivate.length > 0) {
    console.log('')
    console.log(`  ! 排除了需登录的文件夹：${report.excludedPrivate.join('、')}`)
    console.log('    鉴权还没实现，把它们编进公开站等于泄露。')
  }

  if (report.strayDirs.length > 0) {
    console.log('')
    console.log(`  ! content/ 里有不该发布的文件夹，已跳过：${report.strayDirs.join('、')}`)
    console.log('    它们不在 publish: public 的清单里。确认一下是不是配置写错了。')
  }

  if (report.brokenRefs.length > 0) {
    console.log('')
    console.log(
      `  · ${report.brokenRefs.length} 张图源文件本来就不存在（已知断链，已渲染成占位）：`,
    )
    for (const key of report.brokenRefs.slice(0, 3)) console.log(`      ${key}`)
    console.log('    这几张修不了，除非你把笔记里的引用改对。不算构建失败。')
  }

  if (report.missingUploads.length > 0) {
    console.log('')
    console.log(`  ! ${report.missingUploads.length} 张图还没上传到 R2 —— 线上会是裂图：`)
    for (const key of report.missingUploads.slice(0, 6)) console.log(`      ${key}`)
    if (report.missingUploads.length > 6) {
      console.log(`      …还有 ${report.missingUploads.length - 6} 张`)
    }
    console.log('    上传：bun run publish')
    if (!options.allowMissingAssets) fatal = true
  }

  if (report.leakedPaths.length > 0) {
    console.log('')
    console.log(`  ! 产物里出现了本机路径或敏感文件夹名，这不该发生：`)
    for (const item of report.leakedPaths.slice(0, 6)) console.log(`      ${item}`)
    fatal = true
  }

  if (!fatal) {
    console.log('')
    console.log('  本地预览：bun run preview')
  }
  console.log('')
  return fatal
}
