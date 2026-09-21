import { useEffect, useState } from 'react'
import { usePersistentState } from './usePersistentState'

export type ThemeChoice = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

const QUERY = '(prefers-color-scheme: dark)'

function systemTheme(): ResolvedTheme {
  return window.matchMedia(QUERY).matches ? 'dark' : 'light'
}

export function useTheme(): {
  choice: ThemeChoice
  resolved: ResolvedTheme
  cycle: () => void
} {
  const [choice, setChoice] = usePersistentState<ThemeChoice>('mionote:theme', 'system')
  const [system, setSystem] = useState<ResolvedTheme>(systemTheme)

  useEffect(() => {
    const media = window.matchMedia(QUERY)
    const onChange = () => setSystem(media.matches ? 'dark' : 'light')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const resolved: ResolvedTheme = choice === 'system' ? system : choice

  useEffect(() => {
    document.documentElement.dataset.theme = resolved
    // 让原生控件（滚动条、表单）也跟着切换
    document.documentElement.style.colorScheme = resolved
  }, [resolved])

  const cycle = () => {
    setChoice(choice === 'light' ? 'dark' : choice === 'dark' ? 'system' : 'light')
  }

  return { choice, resolved, cycle }
}
