import type { SearchDoc } from '../../shared/types'

export interface SearchHit {
  doc: SearchDoc
  score: number
  /** 正文片段（换行已换成空格，长度不变，所以 ranges 仍然对得上） */
  snippet: string
  /** 需要高亮的区间：[起点, 长度] */
  ranges: Array<[number, number]>
  inTitle: boolean
  inPath: boolean
  count: number
}

const SNIPPET_BEFORE = 28
const SNIPPET_AFTER = 72

/**
 * 全文搜索：直接子串扫描，不建索引、不分词。
 *
 * 一开始打算用 MiniSearch + 中文二字词切分，量了一下发现没必要：
 * 全库 82 篇笔记、正文 386 KB、纯文本索引 208 KB。这种情况下
 * 「82 次 indexOf 扫 400 KB」是亚毫秒级的，比维护倒排索引更快也更准——
 * 尤其是不用赌分词：搜「慢查询」「B+树」「五十音」都是精确子串，
 * 中文单字搜索也直接能用，这是二字词切分做不到的。
 *
 * 笔记量涨到十倍（4 MB）这个方案依然够用。真到了几十 MB 再换 Felscope/Pagefind
 * 也不迟，那时候服务端预建索引才有意义。
 */
export function searchDocs(docs: SearchDoc[], rawQuery: string, limit = 60): SearchHit[] {
  const terms = rawQuery
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
  if (terms.length === 0) return []

  const hits: SearchHit[] = []

  for (const doc of docs) {
    const title = doc.title.toLowerCase()
    const path = doc.path.toLowerCase()
    const text = doc.text.toLowerCase()

    let score = 0
    let count = 0
    let inTitle = false
    let inPath = false
    let allMatched = true

    for (const term of terms) {
      const titleHits = countOccurrences(title, term)
      const pathHits = countOccurrences(path, term)
      const textHits = countOccurrences(text, term)

      if (titleHits === 0 && pathHits === 0 && textHits === 0) {
        allMatched = false
        break
      }
      if (titleHits > 0) inTitle = true
      if (pathHits > 0) inPath = true
      // 标题命中权重远高于正文：搜「MySQL」时你要的是那篇笔记，不是提到 MySQL 的那段话
      score += titleHits * 1000 + pathHits * 300 + Math.min(textHits, 25) * 12
      count += textHits
    }

    if (!allMatched) continue

    const { snippet, ranges } = makeSnippet(doc.text, terms)
    hits.push({ doc, score, snippet, ranges, inTitle, inPath, count })
  }

  hits.sort((a, b) => b.score - a.score || a.doc.path.localeCompare(b.doc.path))
  return hits.slice(0, limit)
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0
  let n = 0
  let i = haystack.indexOf(needle)
  while (i !== -1) {
    n += 1
    i = haystack.indexOf(needle, i + needle.length)
  }
  return n
}

function makeSnippet(original: string, terms: string[]): { snippet: string; ranges: Array<[number, number]> } {
  const lower = original.toLowerCase()
  const anchor = Math.min(
    ...terms.map((t) => {
      const at = lower.indexOf(t)
      return at === -1 ? Number.POSITIVE_INFINITY : at
    }),
  )
  if (!Number.isFinite(anchor)) {
    return { snippet: original.slice(0, SNIPPET_BEFORE + SNIPPET_AFTER), ranges: [] }
  }

  const start = Math.max(0, anchor - SNIPPET_BEFORE)
  const end = Math.min(original.length, anchor + SNIPPET_AFTER)
  const prefix = start > 0 ? '…' : ''

  // 换行换成空格：1 换 1，长度不变，下面的下标计算才不会错位
  const body = original.slice(start, end).replace(/[\r\n\t\u3000]/g, ' ')
  const snippet = `${prefix}${body}${end < original.length ? '…' : ''}`

  const offset = prefix.length
  const bodyLower = body.toLowerCase()
  const ranges: Array<[number, number]> = []
  for (const term of terms) {
    let i = bodyLower.indexOf(term)
    while (i !== -1) {
      ranges.push([offset + i, term.length])
      i = bodyLower.indexOf(term, i + term.length)
    }
  }
  ranges.sort((a, b) => a[0] - b[0])

  return { snippet, ranges }
}

/** 把 ranges 切成可渲染的片段，避免在 JSX 里用 dangerouslySetInnerHTML */
export function renderHighlighted(
  text: string,
  ranges: Array<[number, number]>,
): Array<{ text: string; hit: boolean }> {
  if (ranges.length === 0) return [{ text, hit: false }]

  const parts: Array<{ text: string; hit: boolean }> = []
  let cursor = 0
  for (const [start, length] of ranges) {
    if (start > cursor) parts.push({ text: text.slice(cursor, start), hit: false })
    parts.push({ text: text.slice(start, start + length), hit: true })
    cursor = start + length
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), hit: false })
  return parts
}

/**
 * 短文本（标题、路径）里的命中区间。
 * 正文片段的位置在 searchDocs 里算好了，标题和路径是整串，这里现算。
 */
export function plainRanges(text: string, query: string): Array<[number, number]> {
  const terms = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
  if (terms.length === 0) return []

  const lower = text.toLowerCase()
  const ranges: Array<[number, number]> = []
  for (const term of terms) {
    let i = lower.indexOf(term)
    while (i !== -1) {
      ranges.push([i, term.length])
      i = lower.indexOf(term, i + term.length)
    }
  }
  ranges.sort((a, b) => a[0] - b[0])
  return ranges
}
