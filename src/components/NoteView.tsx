import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import type { Highlighter } from 'shiki'
import type { ImageRefMap, NoteSection } from '../../shared/types'
import { preloadNote, useNote } from '../hooks/useContent'
import { useActiveHeading } from '../hooks/useActiveHeading'
import { useCollapsedSections } from '../hooks/useReadingState'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { breadcrumb } from '../lib/format'
import { navigateStep } from '../lib/routeTransition'
import { Icon } from './Icon'
import { MarkdownView } from './MarkdownView'

/** 和 app.css 里窄屏断点保持一致（900px），改时两边一起改 */
const NARROW_QUERY = '(max-width: 900px)'

interface NoteViewProps {
  sectionId: string
  path: string
  sectionName: string
  sectionRoot: string
  highlighter: Highlighter | null
  onOpenEntry: (entry: {
    id: string
    kind: 'note'
    sectionId: string
    path: string
    title: string
  }) => void
  getProgress: (id: string) => number
  saveProgress: (id: string, top: number) => void
  /** 收起 / 展开右侧目录（状态在 App 上，因为要挂到 .app 的类名上） */
  onToggleToc: () => void
}

interface NoteSectionBlockProps {
  section: NoteSection
  imageRefs: ImageRefMap
  highlighter: Highlighter | null
  collapsed: boolean
  onToggle: () => void
  showHeader: boolean
}

function NoteSectionBlock({
  section,
  imageRefs,
  highlighter,
  collapsed,
  onToggle,
  showHeader,
}: NoteSectionBlockProps) {
  /**
   * 和文件树同样的策略：收起时不卸载，这样折叠动画才有内容可播；
   * 但默认收起的小节首次展开前不挂载——面试/软考一篇几十个问答，
   * 全部渲染一遍既白费解析，也会让里面的图片提前开始加载。
   */
  const [mounted, setMounted] = useState(!collapsed)
  if (!collapsed && !mounted) setMounted(true)

  return (
    <section className="note-section" id={section.id}>
      {showHeader ? (
        <button
          type="button"
          className="note-section__toggle"
          aria-expanded={!collapsed}
          onClick={onToggle}
        >
          <span className="chev">
            <Icon name="chevron" size={18} />
          </span>
          <span className="note-section__title">{section.title}</span>
        </button>
      ) : null}

      <div className="branch" data-open={collapsed ? undefined : ''}>
        <div className="branch__inner">
          {mounted ? (
            <MarkdownView
              markdown={section.markdown}
              imageRefs={imageRefs}
              highlighter={highlighter}
            />
          ) : null}
        </div>
      </div>
    </section>
  )
}

/** 目录列表，桌面右列和窄屏底部抽屉共用一份标记 */
function TocList({
  sections,
  activeId,
  isCollapsed,
  onItemClick,
}: {
  sections: NoteSection[]
  activeId: string | null
  isCollapsed: (id: string) => boolean
  onItemClick: (id: string) => void
}) {
  return (
    <ol className="toc__list">
      {sections.map((section) => (
        <li key={section.id}>
          <button
            type="button"
            className={[
              'toc__item',
              activeId === section.id ? 'toc__item--active' : '',
              isCollapsed(section.id) ? 'toc__item--collapsed' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => onItemClick(section.id)}
          >
            {section.title}
          </button>
        </li>
      ))}
    </ol>
  )
}

export function NoteView({
  sectionId,
  path,
  sectionName,
  sectionRoot,
  highlighter,
  onOpenEntry,
  getProgress,
  saveProgress,
  onToggleToc,
}: NoteViewProps) {
  const { data: note, error, loading } = useNote(sectionId, path)
  const noteId = note?.id ?? null
  const collapsed = useCollapsedSections(noteId)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [copiedPath, setCopiedPath] = useState(false)

  /*
   * 窄屏（手机）上目录的形态由这几个状态撑着（对着参考 app 的手势逐点校过的）：
   *
   *   spyId        —— 当前读到的小节（IntersectionObserver 算的），选中标题行看它
   *   fabVisible   —— 右缘圆钮显不显：滚动时出现、停下约 1.6s 淡出。滚动时只出现圆钮，
   *                   且它的垂直位置跟着阅读进度走（进度把手）
   *   stripOpen    —— 标题栏展开没展开：只有点按/按住圆钮才展开，用户自己一滚就收起
   *   scrubbing    —— 按住标题栏或圆钮拖动进行中：正文实时跟着滚（不是松手才跳）
   *   stripMetrics —— 轨道的半高和单行标题高度，平移量 = center - (index+0.5)*itemH
   */
  const narrow = useMediaQuery(NARROW_QUERY)
  const [tocOpen, setTocOpen] = useState(false)
  const [fabVisible, setFabVisible] = useState(false)
  const [stripOpen, setStripOpen] = useState(false)
  const [scrubbing, setScrubbing] = useState(false)
  const [stripMetrics, setStripMetrics] = useState({ center: 0, itemH: 34 })
  const stripMetricsRef = useRef(stripMetrics)
  stripMetricsRef.current = stripMetrics
  const narrowRef = useRef(narrow)
  narrowRef.current = narrow
  const tocOpenRef = useRef(tocOpen)
  tocOpenRef.current = tocOpen
  const stripOpenRef = useRef(stripOpen)
  stripOpenRef.current = stripOpen
  const scrubbingRef = useRef(scrubbing)
  scrubbingRef.current = scrubbing
  const stripRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<HTMLButtonElement>(null)
  const scrubRef = useRef<{ startY: number; startTop: number; moved: boolean; surface: 'handle' | 'strip' } | null>(null)
  const wasOpenRef = useRef(false)
  const armHideRef = useRef<(() => void) | null>(null)

  // 回调放进 ref：这样下面那些 effect 只依赖 note.id，
  // 否则父组件一重渲染就会重新挂滚动监听、把位置重置掉
  const onOpenEntryRef = useRef(onOpenEntry)
  onOpenEntryRef.current = onOpenEntry
  const getProgressRef = useRef(getProgress)
  getProgressRef.current = getProgress
  const saveProgressRef = useRef(saveProgress)
  saveProgressRef.current = saveProgress

  /*
   * 打开笔记：恢复上次读到的位置。
   *
   * 用 layout effect 而不是 effect + requestAnimationFrame：位置得赶在浏览器绘制之前就位。
   * 差一帧的话，新笔记会先在顶部闪一下再跳下去——平时几乎看不见，但上一篇/下一篇是有
   * 过渡动画的，那一跳会看得清清楚楚；而且页面过渡拍"新快照"时拿到的也必须是恢复好的这一帧。
   *
   * behavior: 'instant' 不能省（也不是默认值）：.reader 上有 scroll-behavior: smooth，
   * 默认行为会从顶部一路滚下去，"恢复位置"就变成了"看一遍滚动动画"。
   */
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el || !noteId) return
    el.scrollTo({ top: getProgressRef.current(noteId), behavior: 'instant' })
  }, [noteId])

  // 预取上下篇：点「下一篇」的那一刻就得有内容，否则页面过渡拍到的是加载页（见 preloadNote）
  useEffect(() => {
    if (!note) return
    if (note.prev) preloadNote(sectionId, note.prev.path)
    if (note.next) preloadNote(sectionId, note.next.path)
  }, [note, sectionId])

  // 滚动时记位置。节流 500ms——每帧都写 localStorage 没有意义
  useEffect(() => {
    const el = scrollRef.current
    if (!el || !noteId) return
    let timer: number | null = null
    const onScroll = () => {
      if (timer !== null) return
      timer = window.setTimeout(() => {
        timer = null
        saveProgressRef.current(noteId, el.scrollTop)
      }, 500)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      if (timer !== null) clearTimeout(timer)
    }
  }, [noteId])

  useEffect(() => {
    if (!note) return
    onOpenEntryRef.current({
      id: note.id,
      kind: 'note',
      sectionId: note.sectionId,
      path: note.path,
      title: note.title,
    })
  }, [note])

  const tocSections = useMemo(
    () => (note?.sections ?? []).filter((section) => section.title),
    [note],
  )
  const splittable = (note?.splitLevel ?? 0) > 0 && tocSections.length > 0

  /*
   * 当前读到哪个小节，交给 IntersectionObserver（见 useActiveHeading）。
   * 滚动监听（下面那个）只剩快捷条的显隐，不再逐帧查小节的位置。
   */
  const sectionIds = useMemo(() => tocSections.map((section) => section.id), [tocSections])
  const [spyId] = useActiveHeading(scrollRef, sectionIds)
  // syncProgressUI 走 DOM 直写不走渲染，这里给它常亮的镜像
  const spyIndexRef = useRef(0)
  spyIndexRef.current = Math.max(0, tocSections.findIndex((section) => section.id === spyId))
  const spyIdRef = useRef(spyId)
  spyIdRef.current = spyId

  /*
   * 进度 UI 的同步：圆钮的位置（= 阅读进度）与轨道的平移一起算——轨道平移让
   * 「选中的标题行」始终正好贴在圆钮的那一行上（用户强调的「跟随」就是这个：
   * 圆钮滑到哪儿，选中标题跟到哪儿）。滚动每一帧都会调用，直接写 DOM 不走渲染。
   */
  const syncProgressUI = useCallback(() => {
    const el = scrollRef.current
    const handle = handleRef.current
    const track = trackRef.current
    if (!el || !handle || !track) return
    const range = el.scrollHeight - el.clientHeight
    const progress = range > 0 ? el.scrollTop / range : 0
    const margin = 96
    const height = 46
    const avail = Math.max(0, window.innerHeight - margin * 2 - height)
    const center = margin + height / 2 + progress * avail
    handle.style.top = `${center - height / 2}px`
    // 条子窗口固定在 top:96，轨道平移把选中行送到圆钮那一行
    track.style.transform = `translateY(${center - margin - (spyIndexRef.current + 0.5) * stripMetricsRef.current.itemH}px)`
  }, [])

  // spy 切到新小节时（IO 异步回调）立刻把轨道对齐到圆钮那一行，不等下一次滚动
  useEffect(() => {
    syncProgressUI()
  }, [spyId, syncProgressUI])
  /*
   * 滚动监听管三件事：
   *   1. 圆钮的垂直位置 = 阅读进度（进度把手，随滚动上下移动），标题栏跟随它展开
   *   2. 圆钮/底部按钮的显隐：滚过开头就亮出来，停下约 1.6s 后淡出
   *      （拖动进行中没有滚动事件来续期，armHide 里会自己续）
   *   3. 用户自己滚动时把展开的标题栏收起（拖动造成的程序滚动不算，有 scrubbing 挡着）
   */
  useEffect(() => {
    const el = scrollRef.current
    if (!el || !note) return
    let hideTimer: number | null = null

    const armHide = () => {
      if (hideTimer !== null) window.clearTimeout(hideTimer)
      hideTimer = window.setTimeout(() => {
        if (scrubbingRef.current) {
          armHide()
          return
        }
        setFabVisible(false)
      }, 1600)
    }
    armHideRef.current = armHide

    syncProgressUI()

    const onScroll = () => {
      syncProgressUI()
      if (scrubbingRef.current) return
      if (stripOpenRef.current) setStripOpen(false)
      if (narrowRef.current && el.scrollTop > 80) {
        setFabVisible(true)
        armHide()
      } else {
        // 顶部 / 桌面：不显示，也别留着会把状态翻回去的旧定时器
        if (hideTimer !== null) {
          window.clearTimeout(hideTimer)
          hideTimer = null
        }
        setFabVisible(false)
      }
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      if (hideTimer !== null) window.clearTimeout(hideTimer)
      armHideRef.current = null
    }
  }, [note, syncProgressUI])

  // 转成桌面形态（或从桌面回来）时把窄屏专有的状态清掉
  useEffect(() => {
    if (!narrow) {
      setFabVisible(false)
      setTocOpen(false)
      setStripOpen(false)
      setScrubbing(false)
      scrubRef.current = null
    }
  }, [narrow])

  // 量轨道：半高（垂直居中点）和单行标题高度。条子的显隐由 CSS 管，量到 0 也无妨
  useLayoutEffect(() => {
    const measure = () => {
      const strip = stripRef.current
      const item = strip?.querySelector<HTMLElement>('.toc-strip__item')
      setStripMetrics({ center: (strip?.clientHeight ?? 0) / 2, itemH: item?.offsetHeight || 34 })
      syncProgressUI()
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [tocSections.length, narrow, syncProgressUI])

  /*
   * 按住标题栏或圆钮上下拖 = 刷正文：手指每动一下，就把 scrollTop 直接推到
   * 「起点 + 位移 × 全文/0.8 屏」的比例上——拖大约一屏正好刷完全文，正文滚动、
   * 选中标题、轨道平移、圆钮位置全部由这次滚动自然联动，不需要各自为政的动画。
   * move/up 挂 window——和侧栏拖宽手柄同一个理由，不依赖 setPointerCapture。
   */
  useEffect(() => {
    if (!scrubbing) return
    const reader = scrollRef.current
    if (!reader) return
    let lastY = scrubRef.current?.startY ?? 0

    const onMove = (event: globalThis.PointerEvent) => {
      const scrub = scrubRef.current
      if (!scrub) return
      if (Math.abs(event.clientY - scrub.startY) > 10) scrub.moved = true
      lastY = event.clientY
      const range = reader.scrollHeight - reader.clientHeight
      const gain = range / Math.max(1, window.innerHeight * 0.8)
      reader.scrollTop = Math.min(range, Math.max(0, scrub.startTop + (event.clientY - scrub.startY) * gain))
    }

    const onEnd = () => {
      const scrub = scrubRef.current
      scrubRef.current = null
      setScrubbing(false)
      setFabVisible(true)
      armHideRef.current?.()
      if (!scrub) return
      if (scrub.moved) return
      // 没怎么动 = 点按。圆钮：关着的按住时已展开、点一下保持；原本开着的点一下收起。
      // 标题栏：跳到指到的那个标题并收起。
      if (scrub.surface === 'handle') {
        if (wasOpenRef.current) setStripOpen(false)
        return
      }
      const track = trackRef.current
      if (track) {
        const rect = track.getBoundingClientRect()
        const index = Math.min(
          tocSections.length - 1,
          Math.max(0, Math.floor((lastY - rect.top) / stripMetrics.itemH)),
        )
        const id = tocSections[index]?.id
        // 瞬时到位：条子马上收起，平滑滚动在这种小距离上只会显得「点了没反应」
        if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'instant', block: 'start' })
      }
      setStripOpen(false)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onEnd)
    window.addEventListener('pointercancel', onEnd)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onEnd)
      window.removeEventListener('pointercancel', onEnd)
    }
  }, [scrubbing, stripMetrics, tocSections])

  /**
   * 跳转到小节。
   *
   * 滚的是「小节元素」而不是里面的内容——小节顶部就是它的折叠按钮，
   * 这个位置不会因为该小节随后展开而移动（内容是在按钮下面长出来的），
   * 所以展开动画和滚动不会互相打架。
   */
  const jumpTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const onTocItemClick = (id: string) => {
    if (collapsed.isCollapsed(id)) collapsed.toggle(id)
    if (narrow) setTocOpen(false)
    jumpTo(id)
  }

  const copyPath = () => {
    const absolute = `${sectionRoot}/${path}`.replace(/\\/g, '/')
    void navigator.clipboard?.writeText(absolute).then(() => {
      setCopiedPath(true)
      window.setTimeout(() => setCopiedPath(false), 1200)
    })
  }

  if (loading && !note) {
    return (
      <>
        <div className="reader" ref={scrollRef}>
          <div className="placeholder">正在读取笔记…</div>
        </div>
        <aside className="toc-col" />
      </>
    )
  }

  if (error || !note) {
    return (
      <>
        <div className="reader" ref={scrollRef}>
          <div className="placeholder placeholder--error">
            <Icon name="warning" size={18} />
            <div>
              <strong>读不了这篇笔记</strong>
              <p>{error ?? '内容为空'}</p>
              <p className="placeholder__hint">
                路径：{sectionRoot}/{path}
              </p>
            </div>
          </div>
        </div>
        <aside className="toc-col" />
      </>
    )
  }

  const crumbs = breadcrumb(path)

  const handleVisible = fabVisible || stripOpen || scrubbing

  /*
   * 两个拖拽面的入口。按住圆钮时若标题栏收着，就地展开——「按住圆钮时才出现」；
   * wasOpen 记下展开前的状态，点按（没拖动）时用来决定收起还是保持。
   */
  const startScrub = (surface: 'handle' | 'strip') => (event: PointerEvent<HTMLElement>) => {
    const reader = scrollRef.current
    if (!reader) return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if (surface === 'handle') {
      wasOpenRef.current = stripOpen
      if (!stripOpen) setStripOpen(true)
    }
    syncProgressUI()
    scrubRef.current = { startY: event.clientY, startTop: reader.scrollTop, moved: false, surface }
    setFabVisible(true)
    setScrubbing(true)
  }

  return (
    <>
      <div className="reader" ref={scrollRef}>
        <article className="doc">
          <header className="doc__head">
            <div className="doc__crumbs">
              <span>{sectionName}</span>
              {crumbs.map((crumb) => (
                <span key={crumb.path}>
                  <span className="doc__crumb-sep">/</span>
                  {crumb.name}
                </span>
              ))}
            </div>

            <h1 className="doc__title">{note.title}</h1>

            <div className="doc__actions">
              {splittable ? (
                <>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => collapsed.setAll(true, tocSections.map((s) => s.id))}
                  >
                    全部折叠
                  </button>
                  <button type="button" className="btn btn--ghost" onClick={() => collapsed.setAll(false, [])}>
                    全部展开
                  </button>
                </>
              ) : null}
              <button type="button" className="btn btn--ghost" onClick={copyPath}>
                <Icon name={copiedPath ? 'check' : 'link'} size={14} />
                {copiedPath ? '已复制' : '复制路径'}
              </button>
            </div>
          </header>

          <div className="doc__body">
            {note.sections.map((section, index) => (
              <NoteSectionBlock
                key={section.id}
                section={section}
                imageRefs={note.imageRefs}
                highlighter={highlighter}
                collapsed={collapsed.isCollapsed(section.id)}
                onToggle={() => collapsed.toggle(section.id)}
                // 文件名派生的标题和小节标题撞车时不重复显示（比如 01-五十音.md）
                showHeader={Boolean(section.title) && !(index === 0 && section.title === note.title)}
              />
            ))}
          </div>

          <footer className="doc__foot">
            {note.prev ? (
              <button
                type="button"
                className="doc__nav doc__nav--prev"
                onClick={() => navigateStep({ kind: 'note', sectionId, path: note.prev!.path }, 'prev')}
              >
                <span className="doc__nav-label">← 上一篇</span>
                <span className="doc__nav-title">{note.prev.title}</span>
              </button>
            ) : (
              <span />
            )}
            {note.next ? (
              <button
                type="button"
                className="doc__nav doc__nav--next"
                onClick={() => navigateStep({ kind: 'note', sectionId, path: note.next!.path }, 'next')}
              >
                <span className="doc__nav-label">下一篇 →</span>
                <span className="doc__nav-title">{note.next.title}</span>
              </button>
            ) : (
              <span />
            )}
          </footer>
        </article>
      </div>

      {/*
        窄屏目录抽屉的遮罩。桌面 display: none——桌面的目录常驻在右列，
        收放走的是 .app--toc-collapsed 那套几何收拢，不经过这里。
      */}
      <div className={tocOpen ? 'toc-scrim toc-scrim--show' : 'toc-scrim'} onClick={() => setTocOpen(false)} />

      {/*
        窄屏的底部目录抽屉（点「打开文档目录」/胶囊/半圆钮唤起）。
        桌面 display: none——桌面目录是常驻右列，不经过这里。
      */}
      <div className={tocOpen ? 'toc-sheet toc-sheet--open' : 'toc-sheet'}>
        {tocSections.length > 0 ? (
          <nav className="toc">
            <div className="toc__head">
              <span>目录</span>
              <button
                type="button"
                className="toc__collapse"
                title="收起目录"
                aria-label="收起目录"
                onClick={() => setTocOpen(false)}
              >
                <Icon name="chevron" size={14} />
              </button>
            </div>
            <TocList
              sections={tocSections}
              activeId={spyId}
              isCollapsed={(id) => collapsed.isCollapsed(id)}
              onItemClick={onTocItemClick}
            />
          </nav>
        ) : null}
      </div>

      {/*
        桌面的目录右列（窄屏 display: none，窄屏入口是右缘快捷条和底部按钮）。
      */}
      <aside className="toc-col">
        {tocSections.length > 0 ? (
          <nav className="toc">
            <div className="toc__head">
              <span>目录</span>
              <button
                type="button"
                className="toc__collapse"
                title="收起目录"
                aria-label="收起目录"
                onClick={onToggleToc}
              >
                <Icon name="chevron" size={14} />
              </button>
            </div>
            <TocList
              sections={tocSections}
              activeId={spyId}
              isCollapsed={(id) => collapsed.isCollapsed(id)}
              onItemClick={onTocItemClick}
            />
          </nav>
        ) : null}
      </aside>

      {/*
        窄屏右缘的「快速目录」标题栏：只有点按/按住圆钮才展开（--open）。
        选中态就是标题行本身（那行直接变成深色胶囊），背景是一层右缘实、往左渐透的纱。
        按住这一整片上下拖 = 刷正文。桌面 display: none。
      */}
      {tocSections.length > 0 ? (
        <div
          className={stripOpen ? 'toc-strip toc-strip--open' : 'toc-strip'}
          ref={stripRef}
          onPointerDown={startScrub('strip')}
        >
          <div ref={trackRef} className="toc-strip__track">
            {tocSections.map((section) => (
              <span
                key={section.id}
                className={
                  spyId === section.id ? 'toc-strip__item toc-strip__item--active' : 'toc-strip__item'
                }
              >
                {section.title}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/*
        右缘圆钮 = 阅读进度把手：滚动时出现、随进度上下移动、停下约 1.6s 后淡出；
        点按展开/收起标题栏，按住上下拖直接刷正文。
      */}
      {tocSections.length > 0 ? (
        <button
          type="button"
          ref={handleRef}
          className={handleVisible ? 'toc-handle toc-handle--show' : 'toc-handle'}
          aria-label="按住上下拖动浏览小节，点按展开标题栏"
          title="按住上下拖动浏览小节，点按展开标题栏"
          onPointerDown={startScrub('handle')}
        >
          <Icon name="filter" size={15} />
        </button>
      ) : null}

      {/*
        底部的「打开文档目录」：滚动时出现、停下淡出，点开底部抽屉。
      */}
      {tocSections.length > 0 ? (
        <button
          type="button"
          className={fabVisible && !tocOpen ? 'toc-sheet-trigger toc-sheet-trigger--show' : 'toc-sheet-trigger'}
          onClick={() => setTocOpen(true)}
        >
          打开文档目录
        </button>
      ) : null}

      {/*
        目录收起后露出的开关：贴在右侧中间（跟左下角那个侧栏开关是一对）。
        只有这篇笔记真有目录时才渲染；显隐交给 CSS（靠 .app--toc-collapsed 判断），
        按钮本身常驻在 DOM 里，才谈得上淡入淡出。
      */}
      {tocSections.length > 0 ? (
        <button type="button" className="toc-reveal" title="展开目录" onClick={onToggleToc}>
          <Icon name="collapse" size={15} />
        </button>
      ) : null}
    </>
  )
}
