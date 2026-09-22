import fs from 'node:fs'
import path from 'node:path'
import type {
  DemoPayload,
  FilePayload,
  MissingAsset,
  NotePayload,
  SearchDoc,
  SearchIndexPayload,
  VaultConfig,
  VaultIndex,
  VaultNode,
  VaultSection,
  VaultSectionConfig,
} from '../../shared/types.ts'
import { parseNote, type AssetResolution, type ParsedNote } from './markdown.ts'
import { flattenNotes, scanSection, type ScannedFile } from './scan.ts'
import { langForExt } from '../../shared/code-lang.ts'
import {
  assetUrl,
  extractExternalHosts,
  normalizeAssetRef,
  resolveInside,
  toPosix,
} from './utils.ts'

interface SectionState {
  scan: ReturnType<typeof scanSection>
  byId: Map<string, ScannedFile>
  /** 按树的前序顺序，也就是阅读顺序 */
  ordered: VaultNode[]
  parsed: Map<string, ParsedNote>
  raw: Map<string, string>
}

interface Built {
  index: VaultIndex
  sections: Map<string, SectionState>
  search: SearchIndexPayload
}

/** 一张被正文引用到的本地图片。解析出 URL 的同时把这三样一起给出去，免得调用方再反解 URL。 */
export interface ResolvedAsset {
  sectionId: string
  /** section 内相对路径 */
  rel: string
  abs: string
}

export interface VaultStoreOptions {
  /**
   * 图片 URL 怎么生成。返回 null 表示"这张图在这个环境里拿不到"，标签会渲染成断链占位。
   *
   * 默认 `/@vault/<section>/<rel>`（本地，中间件直接从磁盘流）。静态构建时换成 R2 域名——
   * 于是**同一份解析逻辑在两个环境下产出不同的 URL**，客户端一行都不用改：
   * 它只是把 payload 里给的字符串塞进 `<img src>`。
   */
  assetUrlFor?: (asset: ResolvedAsset) => string | null
  /**
   * 图片"存在"的判断依据：
   *
   *   'disk'     —— 看磁盘上有没有这个文件。dev 和 publish 用这个（图片确实在本机）。
   *   'registry' —— 交给 assetUrlFor 决定，不看磁盘。静态构建用这个：
   *                 构建时 `content/` 里只有文本，图片全在 R2，磁盘上当然没有，
   *                 照磁盘判断会把每一张图都误报成断链。
   */
  assetLookup?: 'disk' | 'registry'
  /**
   * 正文里引用了、但磁盘上**没有**这个文件时的回调（只在 assetLookup: 'disk' 下会触发）。
   *
   * publish 用它把"本来就坏的链接"记进上传账本，这样静态构建才能把
   * "还没上传"和"链接本身就是坏的"分开——否则构建会把一张永远不存在的图
   * 当成"待上传"，于是怎么传都过不了那一道关。
   */
  onMissingAsset?: (asset: ResolvedAsset) => void
  /** 线上不跑 demo：url 置 null，客户端就只提供「看源码」 */
  demoRunnable?: boolean
}

/**
 * 扫描结果和解析结果都缓存在内存里，改文件时整块作废重建。
 * 全量重建的成本：104 篇笔记 / 0.4 MB 正文，毫秒级。
 */
export class VaultStore {
  private built: Built | null = null

  constructor(
    private readonly config: VaultConfig,
    private readonly options: VaultStoreOptions = {},
  ) {}

  invalidate(): void {
    this.built = null
  }

  private ensure(): Built {
    if (this.built) return this.built

    const started = Date.now()
    const sections: VaultSection[] = []
    const states = new Map<string, SectionState>()
    const missingAssets: MissingAsset[] = []
    const languages = new Set<string>()
    const warnings: string[] = []
    let noteBytes = 0
    let noteCount = 0
    let demoCount = 0

    for (const cfg of this.config.sections) {
      const scan = scanSection(this.config, cfg)
      if (!scan.available) {
        warnings.push(`目录不存在，已跳过：${cfg.name}（${cfg.root}）`)
      }

      const byId = new Map<string, ScannedFile>()
      const parsed = new Map<string, ParsedNote>()
      const raw = new Map<string, string>()

      for (const file of scan.notes) {
        byId.set(`${cfg.id}:${file.rel}`, file)
        const text = readText(file.abs)
        raw.set(file.rel, text)
        const parsedNote = parseNote(text, file.name, this.assetResolver(cfg, file.dir))
        parsed.set(file.rel, parsedNote)
        noteBytes += file.size
        for (const lang of parsedNote.languages) languages.add(lang)
        for (const ref of parsedNote.missing) {
          missingAssets.push({ section: cfg.id, note: file.rel, ref })
        }
      }

      const ordered = flattenNotes(scan.tree)
      states.set(cfg.id, { scan, byId, ordered, parsed, raw })

      /*
       * 高亮语法清单的第二个来源：源码文件的扩展名。
       *
       * 少了这一步，点开 `.vue` 会因为 shiki 没加载 vue 语法而退化成纯文本
       * ——代码照样能读，但"能读"和"读得下去"是两件事。
       */
      for (const file of scan.codes) {
        const lang = langForExt(file.ext)
        if (lang) languages.add(lang)
      }

      noteCount += scan.counts.notes
      demoCount += scan.counts.demos
      sections.push({
        id: cfg.id,
        name: cfg.name,
        root: cfg.root,
        publish: cfg.publish,
        note: cfg.note,
        icon: cfg.icon,
        available: scan.available,
        counts: scan.counts,
        children: scan.tree,
      })
    }

    if (missingAssets.length > 0) {
      warnings.push(
        `${missingAssets.length} 条图片引用指向不存在的文件，已渲染成占位块（详见 stats.missingAssets）`,
      )
    }

    const search = this.buildSearchIndex(states)
    const index: VaultIndex = {
      generatedAt: new Date().toISOString(),
      scanMs: Date.now() - started,
      sections,
      stats: {
        notes: noteCount,
        demos: demoCount,
        noteBytes,
        missingAssets,
        languages: [...languages].sort(),
      },
      warnings,
    }

    this.built = { index, sections: states, search }
    return this.built
  }

  /** 图片引用 → 可访问 URL。返回 'external' 表示外链，'missing' 表示本地文件没了。 */
  private assetResolver(cfg: VaultSectionConfig, dir: string) {
    const cache = new Map<string, AssetResolution>()
    return (src: string): AssetResolution => {
      const norm = normalizeAssetRef(src)
      if (norm === null) return 'external'
      const key = `${dir}\u0000${norm}`
      const hit = cache.get(key)
      if (hit !== undefined) return hit

      let resolution: AssetResolution = 'missing'
      const joined = dir ? `${dir}/${norm}` : norm
      const rel = toPosix(path.posix.normalize(joined))
      if (rel && rel !== '.' && !rel.startsWith('..')) {
        const abs = resolveInside(cfg.root, rel)
        if (abs) {
          const asset: ResolvedAsset = { sectionId: cfg.id, rel, abs }
          /*
           * 注意这里不能用 `assetUrlFor?.(asset) ?? assetUrl(...)`：
           * `??` 会把"策略说了这张图拿不到（返回 null）"和"没提供策略"混成一件事，
           * 于是构建时缺失的图会被悄悄换成 /@vault/ 这个不存在的地址，
           * 既不成断链也不进 missing 报告。必须显式判断。
           */
          const pickUrl = (): string | null =>
            this.options.assetUrlFor ? this.options.assetUrlFor(asset) : assetUrl(cfg.id, rel)

          if (this.options.assetLookup === 'registry') {
            // 图片不在本机（在 R2），所以"有没有"完全由 assetUrlFor 判断
            const url = pickUrl()
            resolution = url === null ? 'missing' : { url }
          } else if (isFile(abs)) {
            const url = pickUrl()
            resolution = url === null ? 'missing' : { url }
          } else {
            // 引用了、但文件不在。交给 publish 记进账本（见 onMissingAsset 的说明）
            this.options.onMissingAsset?.(asset)
          }
        }
      }
      cache.set(key, resolution)
      return resolution
    }
  }

  private buildSearchIndex(states: Map<string, SectionState>): SearchIndexPayload {
    const docs: SearchDoc[] = []
    for (const cfg of this.config.sections) {
      const st = states.get(cfg.id)
      if (!st) continue
      for (const node of st.ordered) {
        const parsed = st.parsed.get(node.path)
        if (!parsed) continue
        docs.push({
          id: node.id,
          sectionId: cfg.id,
          path: node.path,
          title: parsed.title,
          text: parsed.plainText,
        })
      }
    }
    return { generatedAt: new Date().toISOString(), docs }
  }

  getIndex(): VaultIndex {
    return this.ensure().index
  }

  getSearchIndex(): SearchIndexPayload {
    return this.ensure().search
  }

  getNote(sectionId: string, rel: string): NotePayload | null {
    const built = this.ensure()
    const st = built.sections.get(sectionId)
    if (!st) return null
    const parsed = st.parsed.get(rel)
    if (!parsed) return null

    const nodeId = `${sectionId}:${rel}`
    const at = st.ordered.findIndex((n) => n.path === rel)
    const brief = (n: VaultNode | undefined) =>
      n ? { id: n.id, title: st.parsed.get(n.path)?.title ?? n.name, path: n.path } : null

    return {
      id: nodeId,
      sectionId,
      path: rel,
      title: parsed.title,
      markdown: st.raw.get(rel) ?? '',
      sections: parsed.sections,
      splitLevel: parsed.splitLevel,
      imageRefs: parsed.imageRefs,
      missing: parsed.missing,
      bytes: st.byId.get(nodeId)?.size ?? 0,
      mtime: st.byId.get(nodeId)?.mtime ?? 0,
      prev: at > 0 ? brief(st.ordered[at - 1]) : null,
      next: at >= 0 && at + 1 < st.ordered.length ? brief(st.ordered[at + 1]) : null,
    }
  }

  getDemo(sectionId: string, rel: string): DemoPayload | null {
    const built = this.ensure()
    const st = built.sections.get(sectionId)
    if (!st) return null
    const demoFile = st.scan.demos.find((d) => d.rel === rel)
    if (!demoFile) return null

    let externalHosts: string[] = []
    let analysisSkipped = false
    if (demoFile.size > this.config.maxCodeBytes) {
      analysisSkipped = true
    } else {
      externalHosts = extractExternalHosts(readText(demoFile.abs))
    }

    return {
      id: `${sectionId}:${rel}`,
      sectionId,
      path: rel,
      title: rel.slice(rel.lastIndexOf('/') + 1),
      url: this.options.demoRunnable === false ? null : assetUrl(sectionId, rel),
      externalHosts,
      analysisSkipped,
    }
  }

  /**
   * 读一个文本文件。
   * 只允许读扫描时收进来的文件——这是一道白名单，防止构造路径读到别的东西。
   */
  getFile(sectionId: string, rel: string): FilePayload | null {
    const built = this.ensure()
    const st = built.sections.get(sectionId)
    if (!st) return null

    const known =
      st.scan.codes.find((f) => f.rel === rel) ?? st.scan.demos.find((f) => f.rel === rel)
    if (!known) return null

    const text = readText(known.abs)
    const truncated = Buffer.byteLength(text, 'utf8') > this.config.maxCodeBytes
    return {
      id: `${sectionId}:${rel}`,
      sectionId,
      path: rel,
      text: truncated ? text.slice(0, this.config.maxCodeBytes) : text,
      truncated,
      bytes: known.size,
    }
  }

  /** 把 /@vault/ 的路径映射到磁盘上的绝对路径。边界检查在这里。 */
  resolveAssetPath(sectionId: string, rel: string): string | null {
    const cfg = this.config.sections.find((s) => s.id === sectionId)
    if (!cfg) return null
    const abs = resolveInside(cfg.root, rel)
    if (!abs) return null
    let stat: fs.Stats
    try {
      stat = fs.statSync(abs)
    } catch {
      return null
    }
    if (stat.isDirectory()) {
      // demo 里常见的目录式引用，给它 index.html
      const index = path.join(abs, 'index.html')
      return isFile(index) ? index : null
    }
    return stat.isFile() ? abs : null
  }

  getSectionConfig(sectionId: string): VaultSectionConfig | undefined {
    return this.config.sections.find((s) => s.id === sectionId)
  }
}

function readText(abs: string): string {
  try {
    return fs.readFileSync(abs, 'utf8')
  } catch {
    return ''
  }
}

function isFile(abs: string): boolean {
  try {
    return fs.statSync(abs).isFile()
  } catch {
    return false
  }
}
