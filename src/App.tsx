import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
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

/** 侧栏宽度的可调范围。下限够放「软考 20」这类条目，上限不让正文被挤得太窄。 */
const SIDEBAR_MIN = 208
const SIDEBAR_MAX = 520
const SIDEBAR_DEFAULT = 292

const clampWidth = (value: number) => Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, Math.round(value)))

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

  /**
   * 侧栏的两个状态，都是"跟 VS Code 学"的：
   *
   *   collapsed —— 桌面上收起整条侧栏
   *   width     —— 拖右边缘改宽度，拖完记住
   *
   * 窄屏（≤900px）下侧栏是抽屉，用另一个状态 sidebarOpen 控制；两者必须分清：
   * 桌面点开关时如果顺手把抽屉标记也置上，那次点击就"吃掉"了下一次 Ctrl+B
   * （下一次只是把抽屉标记清掉，看起来像快捷键失灵）。
   */
  const [collapsed, setCollapsed] = usePersistentState('mionote:sidebar-collapsed', false)
  const [sidebarWidth, setSidebarWidth] = usePersistentState('mionote:sidebar-width', SIDEBAR_DEFAULT)
  const [resizing, setResizing] = useState(false)
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null)

  /** 和 CSS 里那个断点保持一致（窄屏抽屉用的是 900px） */
  const isNarrow = () => window.matchMedia('(max-width: 900px)').matches

  const toggleSidebar = () => {
    if (isNarrow()) {
      setSidebarOpen((open) => !open)
      return
    }
    setCollapsed((value) => !value)
  }

  const openSidebar = () => {
    if (isNarrow()) setSidebarOpen(true)
    else setCollapsed(false)
  }

  const onResizeStart = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    dragRef.current = { startX: event.clientX, startWidth: sidebarWidth }
    setResizing(true)
  }

  /*
   * 拖动期间的 pointermove/up 挂在 window 上，而不是挂在手柄元素上。
   *
   * 手柄只有 6px 宽，鼠标一往右拖就离开它了；只挂在元素上就必须依赖
   * setPointerCapture 把事件"追回来"（capture 失败或环境不支持时整个拖拽就哑了）。
   * 挂 window 是这类拖拽手柄的常规做法，不依赖任何捕获行为。
   */
  useEffect(() => {
    if (!resizing) return

    const onMove = (event: globalThis.PointerEvent) => {
      const drag = dragRef.current
      if (!drag) return
      setSidebarWidth(clampWidth(drag.startWidth + (event.clientX - drag.startX)))
    }
    const onEnd = () => {
      dragRef.current = null
      setResizing(false)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onEnd)
    window.addEventListener('pointercancel', onEnd)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onEnd)
      window.removeEventListener('pointercancel', onEnd)
    }
  }, [resizing, setSidebarWidth])

  // 双击分隔条回到默认宽度
  const onResizeReset = () => setSidebarWidth(SIDEBAR_DEFAULT)

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
      const key = event.key.toLowerCase()
      // Ctrl+K 搜索，Ctrl+B 收起/展开侧栏（跟 VS Code 一致的键位）
      if ((event.ctrlKey || event.metaKey) && key === 'k') {
        event.preventDefault()
        setSearchOpen((open) => !open)
        return
      }
      if ((event.ctrlKey || event.metaKey) && key === 'b') {
        event.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

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

  const appClass = [
    'app',
    sidebarOpen ? 'app--nav-open' : '',
    collapsed ? 'app--collapsed' : '',
    resizing ? 'app--resizing' : '',
  ]
    .filter(Boolean)
    .join(' ')

  // 宽度通过 CSS 变量下发：`--sidebar-width` 同时被栅格、窄屏抽屉和拖拽用着
  const appStyle = { '--sidebar-width': `${sidebarWidth}px` } as CSSProperties

  return (
    <div className={appClass} style={appStyle}>
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
          onCollapse={toggleSidebar}
        />
        {/*
          拖拽改宽的手柄。放在 <aside> 里而不是网格里单独占一列——后者会在侧栏旁边
          留一条 6px 的空白，而它其实应该压在边框上。
        */}
        <div
          className="sidebar__resizer"
          role="separator"
          aria-orientation="vertical"
          aria-label="拖拽调整侧栏宽度"
          title="拖拽调整宽度，双击恢复默认"
          onPointerDown={onResizeStart}
          onDoubleClick={onResizeReset}
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

      {/*
        侧栏不在眼前时的入口：窄屏下打开抽屉，桌面收起时展开。
      */}
      <button
        type="button"
        className="floating-menu"
        title={collapsed ? '展开侧栏（Ctrl+B）' : '打开侧栏'}
        onClick={openSidebar}
      >
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
