import { useEffect, useState, type RefObject } from 'react'

/**
 * 正文当前标题（scroll-spy）。
 *
 * 用 IntersectionObserver 而不是在滚动事件里逐个查 getBoundingClientRect：
 * rootMargin 圈出一条判定带（阅读区顶部 35% 到 50% 之间），带里的小节按文档序
 * 取最上面的当当前项；带里暂时没货（长小节的中段）就保持上一个值——这正是
 * 「稳定切换、不在相邻两节间来回闪」的关键。滚动监听只补一件事：贴底时强制
 * 裁最后一节（末节太短，标题可能永远够不着判定带），只读scrollTop 不查 DOM。
 *
 * root 必须传真正的滚动容器——正文在 .reader 里滚，不是 window 滚，
 * 判定带装错地方整个 spy 就哑了。
 */
export function useActiveHeading(
  rootRef: RefObject<HTMLElement | null>,
  ids: string[],
): [string | null, (id: string | null) => void] {
  const [activeId, setActiveId] = useState<string | null>(null)
  // 每次渲染 map 出来的都是新数组，靠 join 出的 key 判断内容有没有真的变
  const idsKey = ids.join('\u0000')

  useEffect(() => {
    const root = rootRef.current
    if (!root || ids.length === 0) {
      setActiveId(null)
      return
    }
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null)
    if (elements.length === 0) return

    const inBand = new Map<string, boolean>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          inBand.set((entry.target as HTMLElement).id, entry.isIntersecting)
        }
        for (const id of ids) {
          if (inBand.get(id)) {
            setActiveId(id)
            return
          }
        }
      },
      { root, rootMargin: '-35% 0% -50% 0%', threshold: 0 },
    )
    for (const element of elements) observer.observe(element)

    const onScroll = () => {
      if (root.scrollTop + root.clientHeight >= root.scrollHeight - 4) {
        setActiveId(ids[ids.length - 1] ?? null)
      }
    }
    root.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      observer.disconnect()
      root.removeEventListener('scroll', onScroll)
    }
  }, [idsKey, ids, rootRef])

  return [activeId, setActiveId]
}
