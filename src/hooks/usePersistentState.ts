import { useEffect, useState } from 'react'

/**
 * 存到 localStorage 的 state。
 * 写入失败不抛错——无痕模式或者配额满了不该让阅读器崩掉，大不了记不住位置。
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw === null ? initial : (JSON.parse(raw) as T)
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // 存不下就算了，不影响使用
    }
  }, [key, value])

  return [value, setValue]
}
