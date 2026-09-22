import { useEffect, useState } from 'react'
import { parseHash, sameRoute, subscribeRoute, type Route } from '../lib/router'

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))

  useEffect(() => {
    /*
     * 一个路由会来两趟：navigate() 里同步通知一次（页面过渡要在同一帧拿到新路由），
     * 随后真正的 hashchange 事件再来一次。内容一样就返回上一个对象，
     * 第二次不触发重渲染——否则每次跳转都会白白多渲染一遍整个 App。
     */
    const apply = (next: Route) => setRoute((prev) => (sameRoute(prev, next) ? prev : next))
    const onHashChange = () => apply(parseHash(window.location.hash))

    window.addEventListener('hashchange', onHashChange)
    const unsubscribe = subscribeRoute(apply)
    return () => {
      window.removeEventListener('hashchange', onHashChange)
      unsubscribe()
    }
  }, [])

  return route
}
