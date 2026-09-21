import type {
  Heading,
  ImageRefMap,
  NoteSection,
} from '../../shared/types.ts'
import { baseTitle, stripLeadingNumber } from './utils.ts'

/**
 * 解析一个图片引用的结果。
 * `external` 和 `missing` 必须分开——外链和「本地文件没了」是完全不同的两件事，
 * 混成同一个 null 会把 baidu.com 的 logo 也报成断链。
 */
export type AssetResolution = 'external' | 'missing' | { url: string }

export interface ParsedNote {
  /** 文档标题，由文件名派生 */
  title: string
  /** 自适应切分级别：1 = 按 H1 切，2 = 按 H2 切，0 = 整篇不切 */
  splitLevel: number
  sections: NoteSection[]
  imageRefs: ImageRefMap
  missing: string[]
  /** 送去建搜索索引的纯文本 */
  plainText: string
  /** 这篇里用到的代码块语言 */
  languages: string[]
}

interface HeadingHit {
  lineIndex: number
  level: number
  text: string
}

const IMAGE_RE = /!\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+"[^"]*")?\s*\)/g
const FENCE_RE = /^\s*(```|~~~)\s*([A-Za-z0-9_+#-]*)/

/** 去掉 markdown 语法，得到可以用来搜索的纯文本。代码块内容保留——你会想搜 `Console.WriteLine`。 */
function toPlainText(lines: string[]): string {
  const out: string[] = []
  let inFence = false
  for (const raw of lines) {
    const fence = FENCE_RE.exec(raw)
    if (fence) {
      inFence = !inFence
      continue
    }
    if (inFence) {
      out.push(raw)
      continue
    }
    out.push(
      raw
        // 图片只保留 alt 文本
        .replace(IMAGE_RE, '$1')
        // 链接只保留文字
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        // 标题符号、强调、行内代码之类的标记去掉
        .replace(/^\s{0,3}#{1,6}\s+/, '')
        .replace(/^\s{0,3}>\s?/, '')
        .replace(/^\s*[-*+]\s+/, '')
        .replace(/^\s*\d+\.\s+/, '')
        .replace(/[*_~`]/g, '')
        .replace(/<[^>]+>/g, ''),
    )
  }
  return out
    .join('\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

/**
 * 解析一篇笔记。
 *
 * 切分级别是自适应的，因为你的笔记不是一种形态：
 * 面试/软考是「一篇里几十个 H1」，C#/日语有些篇只有 H2 甚至完全没有标题。
 * 一篇里没有 H1 就退到 H2，连 H2 都没有就整篇呈现——不能因为缺少标题就丢掉内容。
 */
export function parseNote(
  raw: string,
  fileName: string,
  resolveAsset: (src: string) => AssetResolution,
): ParsedNote {
  let text = raw.replace(/^\uFEFF/, '')

  // frontmatter 极少见，但真碰上了不该把它当标题渲染出来
  if (/^---\r?\n/.test(text)) {
    const end = text.indexOf('\n---', 3)
    if (end !== -1) {
      const after = text.indexOf('\n', end + 1)
      if (after !== -1) text = text.slice(after + 1)
    }
  }

  const lines = text.split(/\r?\n/)
  const headings: HeadingHit[] = []
  const languages = new Set<string>()
  const refs = new Map<string, string | null>()
  const missing: string[] = []

  let inFence = false
  let fenceMarker = ''

  lines.forEach((line, i) => {
    const fence = FENCE_RE.exec(line)
    if (fence) {
      const marker = fence[1]
      if (!inFence) {
        inFence = true
        fenceMarker = marker
        const lang = (fence[2] || '').toLowerCase()
        if (lang) languages.add(lang)
      } else if (marker === fenceMarker) {
        inFence = false
        fenceMarker = ''
      }
      return
    }
    if (inFence) return

    const h = /^(#{1,6})\s+(.*)$/.exec(line)
    if (h) {
      headings.push({
        lineIndex: i,
        level: h[1].length,
        text: stripInlineMarkup(h[2]),
      })
    }

    IMAGE_RE.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = IMAGE_RE.exec(line)) !== null) {
      const src = m[2]
      if (refs.has(src)) continue
      const resolved = resolveAsset(src)
      if (resolved === 'external') continue
      if (resolved === 'missing') {
        refs.set(src, null)
        missing.push(src)
        continue
      }
      refs.set(src, resolved.url)
    }
  })

  const hasH1 = headings.some((h) => h.level === 1)
  const hasH2 = headings.some((h) => h.level === 2)
  const splitLevel = hasH1 ? 1 : hasH2 ? 2 : 0

  const title = deriveTitle(fileName)

  const sections = splitIntoSections(lines, headings, splitLevel)

  return {
    title,
    splitLevel,
    sections,
    imageRefs: Object.fromEntries(refs),
    missing,
    plainText: toPlainText(lines),
    languages: [...languages],
  }
}

function splitIntoSections(
  lines: string[],
  headings: HeadingHit[],
  splitLevel: number,
): NoteSection[] {
  const bounds =
    splitLevel === 0
      ? []
      : headings.filter((h) => h.level === splitLevel)

  if (bounds.length === 0) {
    const markdown = lines.join('\n').trim()
    return [
      {
        id: 's0',
        title: '',
        level: 0,
        markdown,
        headings: headings.map((h, i) => toHeading(h, i)),
      },
    ]
  }

  const sections: NoteSection[] = []

  // 第一个标题之前可能有前言，别丢了
  const preamble = lines.slice(0, bounds[0].lineIndex).join('\n').trim()
  if (preamble) {
    sections.push({ id: 's0', title: '', level: 0, markdown: preamble, headings: [] })
  }

  bounds.forEach((bound, bi) => {
    const start = bound.lineIndex + 1
    const end = bi + 1 < bounds.length ? bounds[bi + 1].lineIndex : lines.length
    const own = headings.filter(
      (h) => h.lineIndex >= bound.lineIndex && h.lineIndex < end,
    )
    sections.push({
      id: `s${sections.length}`,
      title: bound.text,
      level: bound.level,
      markdown: lines.slice(start, end).join('\n').trim(),
      headings: own.slice(1).map((h, i) => toHeading(h, i)),
    })
  })

  return sections
}

function toHeading(h: HeadingHit, index: number): Heading {
  return { id: `h${index}`, text: h.text, level: h.level }
}

/**
 * 文档标题一律取文件名，去掉 `02-` 这种编号前缀和扩展名。
 *
 * 试过「取第一个 H1」，不行：你的 H1 有两种用法——既当文档标题，也当小节分隔符。
 * 结果 01_Vue实例-指令.md 的标题变成了「Vue」，Selfintro.md 变成了「实时时间」。
 * 文件名才是你给笔记起的名字，也是你在文件夹里认得出的那个标识。
 */
function deriveTitle(fileName: string): string {
  return stripLeadingNumber(baseTitle(fileName)).trim() || baseTitle(fileName)
}

/** 标题里常混着 `**加粗**` 和行内代码，进 TOC 前要洗干净 */
function stripInlineMarkup(s: string): string {
  return s
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_~`]/g, '')
    .replace(/<[^>]+>/g, '')
    .trim()
}
