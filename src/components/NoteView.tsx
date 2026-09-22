import { useEffect, useMemo, useRef, useState } from 'react'
import type { Highlighter } from 'shiki'
import type { ImageRefMap, NoteSection } from '../../shared/types'
import { useNote } from '../hooks/useContent'
import { useCollapsedSections } from '../hooks/useReadingState'
import { breadcrumb } from '../lib/format'
import { navigate } from '../lib/router'
import { Icon } from './Icon'
import { MarkdownView } from './MarkdownView'

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

export function NoteView({
  sectionId,
  path,
  sectionName,
  sectionRoot,
  highlighter,
  onOpenEntry,
  getProgress,
  saveProgress,
}: NoteViewProps) {
  const { data: note, error, loading } = useNote(sectionId, path)
  const noteId = note?.id ?? null
  const collapsed = useCollapsedSections(noteId)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [copiedPath, setCopiedPath] = useState(false)

  // 回调放进 ref：这样下面那些 effect 只依赖 note.id，
  // 否则父组件一重渲染就会重新挂滚动监听、把位置重置掉
  const onOpenEntryRef = useRef(onOpenEntry)
  onOpenEntryRef.current = onOpenEntry
  const getProgressRef = useRef(getProgress)
  getProgressRef.current = getProgress
  const saveProgressRef = useRef(saveProgress)
  saveProgressRef.current = saveProgress

  // 打开笔记：恢复上次读到的位置
  useEffect(() => {
    const el = scrollRef.current
    if (!el || !noteId) return
    el.scrollTop = 0
    const frame = requestAnimationFrame(() => {
      // 必须跳过平滑滚动：.reader 上有 scroll-behavior: smooth，
      // 直接赋值 scrollTop 会从顶部一路滚下去，恢复位置变成了「看一遍滚动动画」
      el.scrollTo({ top: getProgressRef.current(noteId), behavior: 'instant' })
    })
    return () => cancelAnimationFrame(frame)
  }, [noteId])

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
                onClick={() => navigate({ kind: 'note', sectionId, path: note.prev!.path })}
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
                onClick={() => navigate({ kind: 'note', sectionId, path: note.next!.path })}
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

      <aside className="toc-col">
        {tocSections.length > 0 ? (
          <nav className="toc">
            <div className="toc__head">目录</div>
            <ol className="toc__list">
              {tocSections.map((section) => (
                <li key={section.id}>
                  <button
                    type="button"
                    className={
                      collapsed.isCollapsed(section.id) ? 'toc__item toc__item--collapsed' : 'toc__item'
                    }
                    onClick={() => {
                      if (collapsed.isCollapsed(section.id)) collapsed.toggle(section.id)
                      jumpTo(section.id)
                    }}
                  >
                    {section.title}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
      </aside>
    </>
  )
}
