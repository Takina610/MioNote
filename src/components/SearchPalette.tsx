import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import type { VaultSection } from '../../shared/types'
import { useSearchIndex } from '../hooks/useContent'
import { plainRanges, renderHighlighted, searchDocs, type SearchHit } from '../lib/search'
import { Icon } from './Icon'

interface SearchPaletteProps {
  open: boolean
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

export function SearchPalette({ open, onClose, sections, onOpenHit }: SearchPaletteProps) {
  const { data, loading, error } = useSearchIndex(open)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
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
    if (!open) {
      setQuery('')
      setSelected(0)
      return
    }
    const frame = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    setSelected(0)
  }, [query])

  useEffect(() => {
    listRef.current?.querySelector('.hit--selected')?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  if (!open) return null

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
    <div className="palette" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="palette__panel" onClick={(event) => event.stopPropagation()}>
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
          {data ? <span className="palette__stat">已索引 {data.docs.length} 篇</span> : null}
        </div>
      </div>
    </div>
  )
}
