import { useCallback } from 'react'
import { usePersistentState } from './usePersistentState'

export interface RecentEntry {
  id: string
  kind: 'note' | 'demo' | 'code'
  sectionId: string
  path: string
  title: string
  at: number
}

const MAX_RECENT = 24

/** 读到哪儿了 + 最近打开过什么。都是本机状态，不进内容数据。 */
export function useReadingState(): {
  getProgress: (id: string) => number
  saveProgress: (id: string, top: number) => void
  recent: RecentEntry[]
  pushRecent: (entry: Omit<RecentEntry, 'at'>) => void
  clearRecent: () => void
} {
  const [progress, setProgress] = usePersistentState<Record<string, number>>('mionote:progress', {})
  const [recent, setRecent] = usePersistentState<RecentEntry[]>('mionote:recent', [])

  const getProgress = useCallback((id: string) => progress[id] ?? 0, [progress])

  const saveProgress = useCallback(
    (id: string, top: number) => {
      setProgress((prev) => (prev[id] === top ? prev : { ...prev, [id]: top }))
    },
    [setProgress],
  )

  const pushRecent = useCallback(
    (entry: Omit<RecentEntry, 'at'>) => {
      setRecent((prev) => {
        const rest = prev.filter((e) => e.id !== entry.id)
        return [{ ...entry, at: Date.now() }, ...rest].slice(0, MAX_RECENT)
      })
    },
    [setRecent],
  )

  const clearRecent = useCallback(() => setRecent([]), [setRecent])

  return { getProgress, saveProgress, recent, pushRecent, clearRecent }
}

/**
 * 每篇笔记各自记住哪些小节被折叠了。
 *
 * 面试和软考那种「一篇几十个问答」的笔记，展开状态是需要跨会话保留的：
 * 你想自测的时候把一切折叠起来逐个点开，第二天回来不该从头再来。
 */
export function useCollapsedSections(noteId: string | null): {
  isCollapsed: (sectionId: string) => boolean
  toggle: (sectionId: string) => void
  setAll: (collapsed: boolean, sectionIds: string[]) => void
  count: number
} {
  const [all, setAll] = usePersistentState<Record<string, string[]>>('mionote:collapsed', {})
  const ids = noteId ? all[noteId] ?? [] : []

  const isCollapsed = useCallback((sectionId: string) => ids.includes(sectionId), [ids])

  const toggle = useCallback(
    (sectionId: string) => {
      if (!noteId) return
      setAll((prev) => {
        const current = prev[noteId] ?? []
        const next = current.includes(sectionId)
          ? current.filter((id) => id !== sectionId)
          : [...current, sectionId]
        return { ...prev, [noteId]: next }
      })
    },
    [noteId, setAll],
  )

  const setAllFor = useCallback(
    (collapsed: boolean, sectionIds: string[]) => {
      if (!noteId) return
      setAll((prev) => ({ ...prev, [noteId]: collapsed ? sectionIds : [] }))
    },
    [noteId, setAll],
  )

  return { isCollapsed, toggle, setAll: setAllFor, count: ids.length }
}
