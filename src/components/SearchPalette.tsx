import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import type { VaultSection } from '../../shared/types'
import { useSearchIndex } from '../hooks/useContent'
import { plainRanges, renderHighlighted, searchDocs, type SearchHit } from '../lib/search'
import { Icon } from './Icon'

interface SearchPaletteProps {
  open: boolean
  /** 打开它的那次点击（视口坐标）。键盘打开时没有这个值 */
  origin: { x: number; y: number } | null
  onClose: () => void
  sections: VaultSection[]
  onOpenHit: (hit: SearchHit) => void
}

function Highlighted({ text, query }: { text: string; query: string }) {
  const parts = renderHighlighted(text, plainRanges(text, query))
  return (
    <>
      {parts.map((part, index) =>
        part.hit ? <mark key={index}>{part.text}</mark> : <span key={index}>{part.text}</span>,
      )}
    </>
  )
}

/** 把值夹在范围内 */
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export function SearchPalette({ open, origin, onClose, sections, onOpenHit }: SearchPaletteProps) {
  const { data, loading, error } = useSearchIndex(open)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const sectionNames = useMemo(() => {
    const map = new Map<string, string>()
    for (const section of sections) map.set(section.id, section.name)
    return map
  }, [sections])

  const results = useMemo(
    () => (data && query.trim() ? searchDocs(data.docs, query) : []),
    [data, query],
  )

  useEffect(() => {
    if (!open) return
    /*
     * 重置放在"打开"这一侧，不在"关闭"那一侧：收起是带 190ms 动画的，
     * 那段时间面板还得是刚才那个样子——列表先闪成一条空提示再缩走很难看。
     * （索引数据同样留着，见 useSearchIndex。）
     */
    setQuery('')
    setSelected(0)
    const frame = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [open])

  /*
   * 展开的原点与起点：面板从「打开它的那个搜索框」长出来，跟换主题的圆形扩散是同一个思路
   * （圆心取鼠标）。区别是这个点要夹进面板自己的范围里——原点落在面板外面几百像素时，
   * 面板是斜着从远处飘进来的，那就不像"从搜索框里长出来"了。
   * 除了原点，再算一个朝原点方向的起始位移（--palette-shift-*）：收起时面板缩回
   * 搜索框那一侧，而不是永远往正下方沉。幅度压在几十像素，要的是方向感。
   * 收起时组件不再动它们：原路缩回去。
   */
  useLayoutEffect(() => {
    if (!open) return
    const el = panelRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = origin ? clamp(origin.x - rect.left, 0, rect.width) : rect.width / 2
    const y = origin ? clamp(origin.y - rect.top, 0, rect.height) : 0
    el.style.setProperty('--palette-origin', `${Math.round(x)}px ${Math.round(y)}px`)
    el.style.setProperty('--palette-shift-x', `${clamp(Math.round((x - rect.width / 2) * 0.12), -44, 44)}px`)
    el.style.setProperty('--palette-shift-y', `${clamp(Math.round((y - rect.height / 2) * 0.12), -44, 44)}px`)
  }, [open, origin])

  useEffect(() => {
    setSelected(0)
  }, [query])

  useEffect(() => {
    listRef.current?.querySelector('.hit--selected')?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSelected((index) => Math.min(index + 1, Math.max(results.length - 1, 0)))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSelected((index) => Math.max(index - 1, 0))
      return
    }
    if (event.key === 'Enter') {
      const hit = results[selected]
      if (hit) {
        event.preventDefault()
        onOpenHit(hit)
      }
    }
  }

  const trimmed = query.trim()

  return (
    /*
     * 面板常驻在 DOM 里，开合交给 CSS 的 data-open 过渡：这样收起也有动画可播，
     * 而且过渡能被连续点击"接住"（keyframes 只能从头重播一遍）。
     * 收起后 visibility: hidden 挡住点击、Tab 和读屏软件。
     */
    <div
      className="palette"
      role="dialog"
      aria-modal="true"
      data-open={open ? '' : undefined}
      onClick={onClose}
    >
      <div className="palette__panel" ref={panelRef} onClick={(event) => event.stopPropagation()}>
        <div className="palette__input">
          <Icon name="search" size={17} />
          <input
            ref={inputRef}
            value={query}
            placeholder="搜笔记正文、标题、路径…"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
          />
          <kbd>Esc</kbd>
        </div>

        <div className="palette__body">
          {loading ? <div className="palette__hint">正在载入索引…</div> : null}

          {error ? (
            <div className="palette__hint palette__hint--error">
              <Icon name="warning" size={15} /> 索引载入失败：{error}
            </div>
          ) : null}

          {!loading && !error && !trimmed ? (
            <div className="palette__hint">
              支持中文子串（搜「慢查询」「B+树」都行）、英文单词；多个词用空格隔开表示要同时包含。
            </div>
          ) : null}

          {!loading && trimmed && results.length === 0 ? (
            <div className="palette__hint">没找到和「{trimmed}」有关的笔记。</div>
          ) : null}

          {results.length > 0 ? (
            <ul className="hits" ref={listRef}>
              {results.map((hit, index) => (
                <li key={hit.doc.id}>
                  <button
                    type="button"
                    className={index === selected ? 'hit hit--selected' : 'hit'}
                    onMouseEnter={() => setSelected(index)}
                    onClick={() => onOpenHit(hit)}
                  >
                    <div className="hit__top">
                      <span className="hit__title">
                        <Highlighted text={hit.doc.title} query={trimmed} />
                      </span>
                      <span className="hit__section">{sectionNames.get(hit.doc.sectionId) ?? ''}</span>
                    </div>
                    <div className="hit__path">
                      <Highlighted text={hit.doc.path} query={trimmed} />
                    </div>
                    <div className="hit__snippet">
                      {renderHighlighted(hit.snippet, hit.ranges).map((part, i) =>
                        part.hit ? <mark key={i}>{part.text}</mark> : <span key={i}>{part.text}</span>,
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="palette__foot">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> 选择
          </span>
          <span>
            <kbd>Enter</kbd> 打开
          </span>
          <span>
            <kbd>Esc</kbd> 关闭
          </span>
        </div>
      </div>
    </div>
  )
}
