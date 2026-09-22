import { useEffect, useRef, useState } from 'react'
import type {
  DemoPayload,
  FilePayload,
  NotePayload,
  SearchIndexPayload,
  VaultIndex,
} from '../../shared/types'
import { contentSource } from '../api/contentSource'

export interface ResourceState<T> {
  data: T | null
  error: string | null
  loading: boolean
}

/**
 * 内容缓存。
 *
 * 笔记是只读的，所以缓存可以很激进：命中就直接用，不重新请求。
 * 唯一的失效入口是文件监听推来的 vault:changed（见 App），
 * 那条路径会把整块缓存清掉——「数据旧了」可以接受，「数据错了」不行。
 */
const cache = new Map<string, unknown>()

export function invalidateContentCache(): void {
  cache.clear()
}

function readCache<T>(key: string): T | undefined {
  return cache.get(key) as T | undefined
}

function writeCache<T>(key: string, value: T): void {
  cache.set(key, value)
}

/**
 * 通用取数：只在 key 变化时重新请求。
 *
 * loader 用 ref 存着，所以调用方不用为它的引用稳定性操心——
 * 写成内联箭头函数也不会把 effect 抖成死循环。
 */
function useResource<T>(key: string | null, load: () => Promise<T>): ResourceState<T> {
  const loadRef = useRef(load)
  loadRef.current = load

  const [state, setState] = useState<ResourceState<T>>(() => ({
    data: key ? (readCache<T>(key) ?? null) : null,
    error: null,
    loading: key !== null && !readCache(key),
  }))

  useEffect(() => {
    if (key === null) {
      setState({ data: null, error: null, loading: false })
      return
    }

    const cached = readCache<T>(key)
    if (cached !== undefined) {
      setState({ data: cached, error: null, loading: false })
      return
    }

    let alive = true
    setState({ data: null, error: null, loading: true })
    loadRef
      .current()
      .then((data) => {
        if (!alive) return
        writeCache(key, data)
        setState({ data, error: null, loading: false })
      })
      .catch((error: unknown) => {
        if (!alive) return
        setState({
          data: null,
          error: error instanceof Error ? error.message : String(error),
          loading: false,
        })
      })

    return () => {
      alive = false
    }
  }, [key])

  return state
}

/**
 * refreshToken 由「笔记改动」递增（文件监听推来的 vault:changed）。
 * 它换一个缓存 key，从而绕过本地缓存重新请求——这样就不用在渲染期清缓存，
 * 渲染期做副作用会在并发渲染下出错。
 */
export function useVaultIndex(refreshToken = 0): ResourceState<VaultIndex> {
  return useResource<VaultIndex>(`vault-index#${refreshToken}`, () => contentSource.getIndex())
}

export function useNote(sectionId: string, path: string): ResourceState<NotePayload> {
  const key = sectionId && path ? `note:${sectionId}\u0000${path}` : null
  return useResource<NotePayload>(key, () => contentSource.getNote(sectionId, path))
}

/**
 * 预取一篇笔记进缓存。
 *
 * 「下一篇」按下去的那一刻就得有内容：页面过渡会当场拍一张新快照，
 * 慢一步的话拍到的是"正在读取笔记…"，动画就从"翻页"变成了"翻到一张加载页"。
 * 失败不报错——真点过去时 useNote 会再请求一次，把错误正常显示出来。
 */
const pending = new Set<string>()

export function preloadNote(sectionId: string, path: string): void {
  const key = `note:${sectionId}\u0000${path}`
  if (cache.has(key) || pending.has(key)) return
  pending.add(key)
  void contentSource
    .getNote(sectionId, path)
    .then((data) => {
      writeCache(key, data)
    })
    .catch(() => {
      // 预取是抢时间，不是必需路径，失败就等下一个人来请求
    })
    .finally(() => {
      pending.delete(key)
    })
}

export function useDemo(sectionId: string, path: string): ResourceState<DemoPayload> {
  const key = sectionId && path ? `demo:${sectionId}\u0000${path}` : null
  return useResource<DemoPayload>(key, () => contentSource.getDemo(sectionId, path))
}

export function useFile(
  sectionId: string,
  path: string,
  enabled = true,
): ResourceState<FilePayload> {
  const key = enabled && sectionId && path ? `file:${sectionId}\u0000${path}` : null
  return useResource<FilePayload>(key, () => contentSource.getFile(sectionId, path))
}

/**
 * 搜索索引有 200 KB 出头，没必要在打开页面时就拉——等第一次按 Ctrl+K 再取。
 *
 * 关闭时**留着上一次的索引**：面板是带收起动画的，收起的那 190ms 里它还得是
 * 「刚才那个样子」。数据跟着 key 一起被清掉的话，列表会先闪成一条空提示再缩走。
 */
export function useSearchIndex(enabled: boolean): ResourceState<SearchIndexPayload> {
  const state = useResource<SearchIndexPayload>(enabled ? 'search-index' : null, () =>
    contentSource.getSearchIndex(),
  )

  const lastData = useRef<SearchIndexPayload | null>(null)
  if (state.data) lastData.current = state.data

  const kept = lastData.current
  return state.data || !kept ? state : { data: kept, error: null, loading: false }
}
