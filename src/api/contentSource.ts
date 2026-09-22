import type {
  DemoPayload,
  FilePayload,
  NotePayload,
  SearchIndexPayload,
  VaultIndex,
} from '../../shared/types'
import { StaticContentSource } from './staticContentSource'

/**
 * 内容来源。
 *
 * 这个接口是整个项目里最关键的一道缝：界面只认它，不关心内容从哪儿来。
 * 现在有两个实现，按环境自动切换：
 *   · dev  —— HTTP 接口，由 Vite 插件读磁盘（改完笔记立刻能看到，图片也是原图）
 *   · 生产 —— 构建时生成的静态 JSON，图片指向 R2（见 plugins/vault/build.ts）
 * 形状完全一致，所以这一版的 React 代码在两边都能跑。
 * 将来的第三个是 Tauri 桌面端（走 IPC 直接读磁盘，能读还没索引的新文件）。
 */
export interface ContentSource {
  getIndex(): Promise<VaultIndex>
  getNote(sectionId: string, path: string): Promise<NotePayload>
  getDemo(sectionId: string, path: string): Promise<DemoPayload>
  getFile(sectionId: string, path: string): Promise<FilePayload>
  getSearchIndex(): Promise<SearchIndexPayload>
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`
    try {
      const body = (await response.json()) as { error?: string }
      if (body?.error) message = body.error
    } catch {
      // 响应不是 JSON，就用状态码当错误信息
    }
    throw new Error(message)
  }
  return (await response.json()) as T
}

function endpoint(name: string, params: Record<string, string>): string {
  const qs = new URLSearchParams(params)
  return `/api/${name}?${qs.toString()}`
}

class HttpContentSource implements ContentSource {
  getIndex(): Promise<VaultIndex> {
    return fetchJson<VaultIndex>('/api/vault')
  }

  getNote(sectionId: string, path: string): Promise<NotePayload> {
    return fetchJson<NotePayload>(endpoint('note', { section: sectionId, path }))
  }

  getDemo(sectionId: string, path: string): Promise<DemoPayload> {
    return fetchJson<DemoPayload>(endpoint('demo', { section: sectionId, path }))
  }

  getFile(sectionId: string, path: string): Promise<FilePayload> {
    return fetchJson<FilePayload>(endpoint('file', { section: sectionId, path }))
  }

  getSearchIndex(): Promise<SearchIndexPayload> {
    return fetchJson<SearchIndexPayload>('/api/search-index')
  }
}

export const contentSource: ContentSource = import.meta.env.DEV
  ? new HttpContentSource()
  : new StaticContentSource()
