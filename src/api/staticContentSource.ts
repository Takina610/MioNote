import type {
  DemoPayload,
  FilePayload,
  NotePayload,
  SearchIndexPayload,
  VaultIndex,
} from '../../shared/types'
import type { ContentSource } from './contentSource'
import { encodePath } from '../lib/path'

/**
 * 云端静态站的 ContentSource：读构建时生成的 JSON，图片指向 R2。
 *
 * 它和 HTTP 版形状完全一致，所以 React 代码一行都没改——这正是 `ContentSource`
 * 那道缝当初留出来的用途（见 docs/SPEC.md 第五节）。
 *
 * 两个和 dev 不同的地方，都是"线上就是这样"的如实反映：
 *
 * 1. `getFile` 直接取 `/@vault/` 下的原文件（构建时从 content/ 拷进产物），
 *    按构建期注入的阈值截断。所以"看源码"在线上和本地表现一致。
 * 2. demo 的 `url` 是 null（服务端生成的 payload 里就是 null），
 *    客户端据此只提供「看源码」——不猜、不试、不给一个注定缺图的 iframe。
 */
async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    // 404 最可能的原因是这篇笔记/这个 demo 没进这次构建（比如它所在的文件夹不是 public）
    throw new Error(
      response.status === 404 ? `线上没有这份内容（404）：${url}` : `${response.status} ${response.statusText}`,
    )
  }
  return (await response.json()) as T
}

export class StaticContentSource implements ContentSource {
  async getIndex(): Promise<VaultIndex> {
    return fetchJson<VaultIndex>('/api/vault.json')
  }

  async getNote(sectionId: string, path: string): Promise<NotePayload> {
    return fetchJson<NotePayload>(`/api/note/${sectionId}/${encodePath(path)}.json`)
  }

  async getDemo(sectionId: string, path: string): Promise<DemoPayload> {
    return fetchJson<DemoPayload>(`/api/demo/${sectionId}/${encodePath(path)}.json`)
  }

  async getFile(sectionId: string, path: string): Promise<FilePayload> {
    const url = `/@vault/${sectionId}/${encodePath(path)}`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`读不到这个文件：${response.status} ${response.statusText}`)

    const raw = await response.text()
    const bytes = new TextEncoder().encode(raw).length
    // 阈值来自 vault.config.ts 的 maxCodeBytes，由 vite.config.ts 的 define 注入，
    // 所以线上截断的位置和本地服务端一模一样
    const limit = __MAX_CODE_BYTES__
    const truncated = bytes > limit
    return {
      id: `${sectionId}:${path}`,
      sectionId,
      path,
      text: truncated ? raw.slice(0, limit) : raw,
      truncated,
      bytes,
    }
  }

  async getSearchIndex(): Promise<SearchIndexPayload> {
    return fetchJson<SearchIndexPayload>('/api/search-index.json')
  }
}
