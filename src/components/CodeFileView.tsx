import { useEffect, useRef } from 'react'
import type { Highlighter } from 'shiki'
import { useFile } from '../hooks/useContent'
import { formatBytes } from '../lib/format'
import { CodeView, langFromExt } from './CodeView'
import { CopyButton } from './CopyButton'
import { Icon } from './Icon'

interface CodeFileViewProps {
  sectionId: string
  path: string
  sectionName: string
  highlighter: Highlighter | null
  onOpenEntry: (entry: {
    id: string
    kind: 'code'
    sectionId: string
    path: string
    title: string
  }) => void
}

/**
 * 源码文件视图：只读，没有预览。
 *
 * 为什么单独一个组件而不是复用 DemoView：demo 是"能跑的东西"，它的核心是那个 iframe
 * 和「能不能跑」的判断；源码文件的核心只有一段文本。硬塞进 DemoView 会让那边多出
 * 一堆 `if (isDemo)` 分支，而两者的头部、右上角按钮、提示条没有一处是共享的。
 *
 * 只有 `demoExtensions`（.html/.htm）能预览——想跑 .vue 需要打包器，跑 .js 需要
 * 一个宿主页面，这些都不在这个只读阅读器的范围内。所以这里只负责"读得舒服"。
 */
export function CodeFileView({
  sectionId,
  path,
  sectionName,
  highlighter,
  onOpenEntry,
}: CodeFileViewProps) {
  const { data, error, loading } = useFile(sectionId, path)
  const name = path.slice(path.lastIndexOf('/') + 1)

  const onOpenEntryRef = useRef(onOpenEntry)
  onOpenEntryRef.current = onOpenEntry

  useEffect(() => {
    if (!data) return
    onOpenEntryRef.current({
      id: data.id,
      kind: 'code',
      sectionId: data.sectionId,
      path: data.path,
      title: name,
    })
  }, [data, name])

  const lang = langFromExt(path.slice(path.lastIndexOf('.')))

  return (
    <>
      <div className="reader">
        <article className="doc doc--code">
          <header className="doc__head">
            <div className="doc__crumbs">
              <span>{sectionName}</span>
              <span className="doc__crumb-sep">/</span>
              <span>源码</span>
            </div>
            <h1 className="doc__title doc__title--file">{name}</h1>
            <div className="doc__meta">
              <span className="doc__path">{path}</span>
            </div>
          </header>

          <div className="doc__body">
            {loading ? (
              <div className="placeholder">正在读取源码…</div>
            ) : error ? (
              <div className="placeholder placeholder--error">
                <Icon name="warning" size={18} />
                <div>
                  <strong>读不了这个文件</strong>
                  <p>{error}</p>
                </div>
              </div>
            ) : data ? (
              <div className="source">
                <div className="source__meta">
                  <span>{lang || '纯文本'}</span>
                  <span className="source__actions">
                    <span>
                      {formatBytes(data.bytes)}
                      {data.truncated ? '（已截断）' : ''}
                    </span>
                    <CopyButton text={data.text} />
                  </span>
                </div>
                <CodeView
                  code={data.text}
                  lang={lang}
                  highlighter={highlighter}
                />
              </div>
            ) : (
              <div className="placeholder">这个文件不能以文本方式查看。</div>
            )}
          </div>
        </article>
      </div>

      <aside className="toc-col" />
    </>
  )
}
