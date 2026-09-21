import fs from 'node:fs'
import path from 'node:path'
import type { VaultConfig, VaultNode, VaultSectionConfig } from '../../shared/types.ts'
import { naturalCompare, toPosix } from './utils.ts'

export interface ScannedFile {
  abs: string
  /** section 内相对路径，posix 分隔 */
  rel: string
  /** 所在目录的相对路径，根目录是空串 */
  dir: string
  name: string
  /** 小写，带点 */
  ext: string
  size: number
  mtime: number
  kind: 'note' | 'demo' | 'code'
}

export interface SectionScan {
  config: VaultSectionConfig
  available: boolean
  notes: ScannedFile[]
  demos: ScannedFile[]
  codes: ScannedFile[]
  /** 目录相对路径 → 该目录直接包含的文本文件，给 demo 的「看源码」用 */
  filesByDir: Map<string, ScannedFile[]>
  tree: VaultNode[]
  counts: { notes: number; demos: number; folders: number }
}

interface DirEntry {
  name: string
  rel: string
  dirs: Map<string, DirEntry>
  notes: ScannedFile[]
  demos: ScannedFile[]
}

function emptyDir(name: string, rel: string): DirEntry {
  return { name, rel, dirs: new Map(), notes: [], demos: [] }
}

/**
 * 遍历一个笔记文件夹。
 *
 * 只把 .md（笔记）、demo 扩展名、以及可读的源码文件收进来；图片、字体、二进制
 * 一律当成「资源」——它们不进内容树，只在正文里被引用时按需读取。
 * 所以 Web 前端那 1 GB 里真正进索引的只有几千个文本文件，扫描是毫秒级的。
 */
export function scanSection(config: VaultConfig, section: VaultSectionConfig): SectionScan {
  const ignoreDirs = new Set(config.ignoreDirs)
  const ignoreFiles = new Set(config.ignoreFiles)
  const demoExts = new Set(config.demoExtensions.map((e) => e.toLowerCase()))
  const codeExts = new Set(config.codeExtensions.map((e) => e.toLowerCase()))

  const root = section.root
  const result: SectionScan = {
    config: section,
    available: false,
    notes: [],
    demos: [],
    codes: [],
    filesByDir: new Map(),
    tree: [],
    counts: { notes: 0, demos: 0, folders: 0 },
  }

  if (!fs.existsSync(root)) return result
  result.available = true

  const dirRoot = emptyDir('', '')

  const ensureDir = (rel: string): DirEntry => {
    if (!rel) return dirRoot
    const parts = rel.split('/')
    let cur = dirRoot
    let acc = ''
    for (const p of parts) {
      acc = acc ? `${acc}/${p}` : p
      let next = cur.dirs.get(p)
      if (!next) {
        next = emptyDir(p, acc)
        cur.dirs.set(p, next)
      }
      cur = next
    }
    return cur
  }

  const stack: string[] = ['']
  while (stack.length > 0) {
    const relDir = stack.pop() as string
    const absDir = relDir ? path.join(root, relDir) : root

    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(absDir, { withFileTypes: true })
    } catch {
      // 权限之类的读不了就跳过，不要让整个扫描挂掉
      continue
    }

    for (const entry of entries) {
      const childRel = relDir ? `${relDir}/${entry.name}` : entry.name

      if (entry.isDirectory()) {
        if (ignoreDirs.has(entry.name)) continue
        stack.push(childRel)
        continue
      }
      if (!entry.isFile()) continue
      if (ignoreFiles.has(entry.name)) continue

      const ext = path.extname(entry.name).toLowerCase()
      const kind =
        ext === '.md' ? 'note' : demoExts.has(ext) ? 'demo' : codeExts.has(ext) ? 'code' : null
      if (!kind) continue

      const abs = path.join(root, childRel)
      let size = 0
      let mtime = 0
      try {
        const st = fs.statSync(abs)
        size = st.size
        mtime = st.mtimeMs
      } catch {
        continue
      }

      const file: ScannedFile = {
        abs,
        rel: toPosix(childRel),
        dir: relDir,
        name: entry.name,
        ext,
        size,
        mtime,
        kind,
      }

      const dirEntry = ensureDir(relDir)
      if (kind === 'note') {
        dirEntry.notes.push(file)
        result.notes.push(file)
      } else if (kind === 'demo') {
        dirEntry.demos.push(file)
        result.demos.push(file)
      } else {
        result.codes.push(file)
      }

      // 同目录的文本文件都进「看源码」的候选，包括 md 和 demo 自己
      const bucket = result.filesByDir.get(relDir)
      if (bucket) bucket.push(file)
      else result.filesByDir.set(relDir, [file])
    }
  }

  const nodeFor = (f: ScannedFile, kind: 'note' | 'demo'): VaultNode => ({
    kind,
    id: `${section.id}:${f.rel}`,
    name: f.name,
    path: f.rel,
    size: f.size,
    mtime: f.mtime,
  })

  const kindRank = { note: 0, demo: 1, folder: 2 } as const

  const toNodes = (dirEntry: DirEntry): VaultNode[] => {
    const nodes: VaultNode[] = []
    for (const n of dirEntry.notes) nodes.push(nodeFor(n, 'note'))
    for (const d of dirEntry.demos) nodes.push(nodeFor(d, 'demo'))
    for (const child of dirEntry.dirs.values()) {
      const children = toNodes(child)
      // 只放图片/二进制的目录不进树——软考的 img1~img4 就是这么被挡在外面的
      if (children.length === 0) continue
      nodes.push({
        kind: 'folder',
        id: `${section.id}:${child.rel}`,
        name: child.name,
        path: child.rel,
        children,
      })
    }
    nodes.sort((a, b) => {
      const r = kindRank[a.kind] - kindRank[b.kind]
      return r !== 0 ? r : naturalCompare(a.name, b.name)
    })
    return nodes
  }

  result.tree = toNodes(dirRoot)

  // 顺便把每个目录下的源码文件排好序，供 demo 源码标签页使用
  for (const [dir, files] of result.filesByDir) {
    files.sort((a, b) => {
      // demo 自己排最前，然后 html / css / js 之类
      if (a.kind !== b.kind) return a.kind === 'demo' ? -1 : b.kind === 'demo' ? 1 : 0
      return naturalCompare(a.name, b.name)
    })
    result.filesByDir.set(dir, files)
  }

  const countNodes = (nodes: VaultNode[]): void => {
    for (const n of nodes) {
      if (n.kind === 'folder') {
        result.counts.folders += 1
        if (n.children) countNodes(n.children)
      } else if (n.kind === 'note') result.counts.notes += 1
      else result.counts.demos += 1
    }
  }
  countNodes(result.tree)

  return result
}

/** 按树的前序遍历把所有笔记串成阅读顺序，用来算上一篇/下一篇 */
export function flattenNotes(nodes: VaultNode[], out: VaultNode[] = []): VaultNode[] {
  for (const n of nodes) {
    if (n.kind === 'folder' && n.children) flattenNotes(n.children, out)
    else if (n.kind === 'note') out.push(n)
  }
  return out
}
