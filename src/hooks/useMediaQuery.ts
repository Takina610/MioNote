import { useEffect, useState } from 'react'

/**
 * 响应式地跟踪一个媒体查询。断点数值必须和样式里写的一致（比如窄屏 900px），
 * 改的时候两边要一起改——JS 这边没有单一真相来源。
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches)
    setMatches(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}
