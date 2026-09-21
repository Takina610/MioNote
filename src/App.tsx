import { useEffect, useMemo, useRef, useState } from 'react'
import type { Highlighter } from 'shiki'
import type { VaultNode } from '../shared/types'
import { DemoView } from './components/DemoView'
import { HomeView } from './components/HomeView'
import { Icon } from './components/Icon'
import { NoteView } from './components/NoteView'
import { SearchPalette } from './components/SearchPalette'
import { Sidebar } from './components/Sidebar'
import { invalidateContentCache, useVaultIndex } from './hooks/useContent'
import { usePersistentState } from './hooks/usePersistentState'
import { useReadingState, type RecentEntry } from './hooks/useReadingState'
import { useRoute } from './hooks/useRoute'
import { useTheme } from './hooks/useTheme'
import { initHighlighter } from './lib/highlighter'
import { navigate } from './lib/router'
import type { SearchHit } from './lib/search'

export function App() {
  const route = useRoute()
  const [refreshToken, setRefreshToken] = useState(0)
  const { data: index, error, loading } = useVaultIndex(refreshToken)
  const [expanded, setExpanded] = usePersistentState<Record<string, boolean>>('mionote:tree', {})
  const [searchOpen, setSearchOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [highlighter, setHighlighter] = useState<Highlighter | null>(null)
  const theme = useTheme()
  const reading = useReadingState()

  // 第一次打开时把第一个文件夹展开，之后完全听用户的（已存进 localStorage）
  const seeded = useRef(false)
  useEffect(() => {
    if (!index || seeded.current) return
    seeded.current = true
    setExpanded((prev) => {
      if (Object.keys(prev).length > 0) return prev
      const first = index.sections[0]
      return first ? { [`section:${first.id}`]: true } : prev
    })
  }, [index, setExpanded])

  // 语法高亮按扫描到的语言清单加载，不把 shiki 几百种语法全拖进来
  useEffect(() => {
    if (!index) return
    let alive = true
    void initHighlighter(index.stats.languages).then((created) => {
      if (alive) setHighlighter(created)
    })
    return () => {
      alive = false
    }
  }, [index])

  // 文件监听说笔记变了：清掉内容缓存并重新拉索引
  useEffect(() => {
    const hot = import.meta.hot
    if (!hot) return
    const onVaultChanged = () => {
      invalidateContentCache()
      setRefreshToken((token) => token + 1)
    }
    hot.on('vault:changed', onVaultChanged)
    return () => {
      hot.off('vault:changed', onVaultChanged)
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const openNode = (sectionId: string, node: VaultNode) => {
    navigate(
      node.kind === 'note'
        ? { kind: 'note', sectionId, path: node.path }
        : { kind: 'demo', sectionId, path: node.path },
    )
    setSidebarOpen(false)
  }

  const openRecent = (entry: RecentEntry) => {
    navigate({ kind: entry.kind, sectionId: entry.sectionId, path: entry.path })
    setSidebarOpen(false)
  }

  const openHit = (hit: SearchHit) => {
    navigate({ kind: 'note', sectionId: hit.doc.sectionId, path: hit.doc.path })
    setSearchOpen(false)
    setSidebarOpen(false)
  }

  const toggleTree = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const rescan = () => {
    invalidateContentCache()
    setRefreshToken((token) => token + 1)
  }

  const activeSection = useMemo(() => {
    if (route.kind === 'home' || !index) return null
    return index.sections.find((section) => section.id === route.sectionId) ?? null
  }, [index, route])

  if (error && !index) {
    return (
      <div className="boot boot--error">
        <Icon name="warning" size={20} />
        <h1>读不到笔记索引</h1>
        <p>{error}</p>
        <p className="boot__hint">
          先看看 <code>vault.config.ts</code> 里的路径对不对，然后重试。
        </p>
      </div>
    )
  }

  if (!index) {
    return <div className="boot">{loading ? '正在扫描笔记文件夹…' : '准备中…'}</div>
  }

  const activeId = route.kind === 'home' ? null : `${route.sectionId}:${route.path}`

  return (
    <div className={sidebarOpen ? 'app app--nav-open' : 'app'}>
      <aside className="sidebar">
        <Sidebar
          index={index}
          expanded={expanded}
          activeId={activeId}
          recent={reading.recent}
          themeChoice={theme.choice}
          onToggleTree={toggleTree}
          onOpenNode={openNode}
          onOpenRecent={openRecent}
          onOpenSearch={() => setSearchOpen(true)}
          onCycleTheme={theme.cycle}
          onRescan={rescan}
          rescanning={loading}
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      <div className="scrim" onClick={() => setSidebarOpen(false)} />

      <main className="view">
        {route.kind === 'home' ? (
          <HomeView
            index={index}
            recent={reading.recent}
            onOpenSection={openNode}
            onOpenRecent={openRecent}
            onOpenSearch={() => setSearchOpen(true)}
          />
        ) : !activeSection ? (
          <>
            <div className="reader">
              <div className="placeholder placeholder--error">
                <Icon name="warning" size={18} />
                <div>
                  <strong>这个文件夹不在 vault.config.ts 里</strong>
                  <p>section：{route.sectionId}</p>
                </div>
              </div>
            </div>
            <aside className="toc-col" />
          </>
        ) : route.kind === 'note' ? (
          <NoteView
            key={activeId}
            sectionId={route.sectionId}
            path={route.path}
            sectionName={activeSection.name}
            sectionRoot={activeSection.root}
            highlighter={highlighter}
            onOpenEntry={reading.pushRecent}
            getProgress={reading.getProgress}
            saveProgress={reading.saveProgress}
          />
        ) : (
          <DemoView
            key={activeId}
            sectionId={route.sectionId}
            path={route.path}
            sectionName={activeSection.name}
            highlighter={highlighter}
            onOpenEntry={reading.pushRecent}
          />
        )}
      </main>

      <button type="button" className="floating-menu" title="打开侧栏" onClick={() => setSidebarOpen(true)}>
        <Icon name="menu" size={18} />
      </button>

      <SearchPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        sections={index.sections}
        onOpenHit={openHit}
      />
    </div>
  )
}
