import { useEffect, useRef, useState } from 'react'
import type { Highlighter } from 'shiki'
import { useDemo, useFile } from '../hooks/useContent'
import { formatBytes } from '../lib/format'
import { CodeView, langFromExt } from './CodeView'
import { FileIcon, resolveFileIcon } from './FileIcon'
import { Icon } from './Icon'

interface DemoViewProps {
  sectionId: string
  path: string
  sectionName: string
  highlighter: Highlighter | null
  onOpenEntry: (entry: {
    id: string
    kind: 'demo'
    sectionId: string
    path: string
    title: string
  }) => void
}

/**
 * demo 预览。
 *
 * iframe 直接用 /@vault/ 下 demo 的真实路径，所以它里面的相对引用
 * （css/js/图片）全都能按原样解析——不用重写 HTML，也不用构建。
 */
export function DemoView({ sectionId, path, sectionName, highlighter, onOpenEntry }: DemoViewProps) {
  const { data: demo, error, loading } = useDemo(sectionId, path)
  const [tab, setTab] = useState<'preview' | 'source'>('preview')
  const [activeFile, setActiveFile] = useState(path)
  const [frameKey, setFrameKey] = useState(0)

  const onOpenEntryRef = useRef(onOpenEntry)
  onOpenEntryRef.current = onOpenEntry

  useEffect(() => {
    setActiveFile(path)
    setTab('preview')
  }, [path])

  useEffect(() => {
    if (!demo) return
    onOpenEntryRef.current({
      id: demo.id,
      kind: 'demo',
      sectionId: demo.sectionId,
      path: demo.path,
      title: demo.title,
    })
  }, [demo])

  const source = useFile(sectionId, activeFile, tab === 'source')

  if (loading && !demo) {
    return (
      <>
        <div className="reader">
          <div className="placeholder">正在读取 demo…</div>
        </div>
        <aside className="toc-col" />
      </>
    )
  }

  if (error || !demo) {
    return (
      <>
        <div className="reader">
          <div className="placeholder placeholder--error">
            <Icon name="warning" size={18} />
            <div>
              <strong>打不开这个 demo</strong>
              <p>{error ?? '内容为空'}</p>
            </div>
          </div>
        </div>
        <aside className="toc-col" />
      </>
    )
  }

  const needsNetwork = demo.externalHosts.length > 0

  return (
    <>
      <div className="reader">
        <article className="doc doc--demo">
          <header className="doc__head">
            <div className="doc__crumbs">
              <span>{sectionName}</span>
              <span className="doc__crumb-sep">/</span>
              <span>demo</span>
            </div>
            <h1 className="doc__title doc__title--demo">{demo.title}</h1>
            <div className="doc__meta">
              <span className="doc__path">{demo.path}</span>
            </div>

            <div className="doc__actions">
              <div className="tabs">
                <button
                  type="button"
                  className={tab === 'preview' ? 'tab tab--active' : 'tab'}
                  onClick={() => setTab('preview')}
                >
                  预览
                </button>
                <button
                  type="button"
                  className={tab === 'source' ? 'tab tab--active' : 'tab'}
                  onClick={() => setTab('source')}
                >
                  看源码
                </button>
              </div>
              <button type="button" className="btn btn--ghost" onClick={() => setFrameKey((k) => k + 1)}>
                <Icon name="refresh" size={13} />
                重新加载
              </button>
              <a className="btn btn--ghost" href={demo.url} target="_blank" rel="noreferrer">
                <Icon name="external" size={13} />
                新标签页打开
              </a>
            </div>

            {needsNetwork ? (
              <div className="notice">
                <Icon name="public" size={15} />
                <div>
                  <strong>这个 demo 依赖外部域名，可能打不开</strong>
                  <p>
                    它引用了 {demo.externalHosts.slice(0, 4).join('、')}
                    {demo.externalHosts.length > 4 ? ` 等 ${demo.externalHosts.length} 个域名` : ''}。
                    课程配套的接口很多已经失效，或者会被浏览器的跨域策略挡掉——页面白屏多半是这个原因，
                    不是你的代码写错了。下面的源码照样能看。
                  </p>
                </div>
              </div>
            ) : demo.analysisSkipped ? (
              <div className="notice notice--muted">
                <Icon name="warning" size={15} />
                <div>这个 HTML 太大，没有分析它是否依赖外部域名。</div>
              </div>
            ) : null}
          </header>

          <div className="doc__body doc__body--demo">
            {tab === 'preview' ? (
              <div className="frame">
                <iframe
                  key={frameKey}
                  className="frame__inner"
                  src={demo.url}
                  title={demo.title}
                  loading="lazy"
                  // allow-same-origin 是必需的：不带上它 iframe 会变成不透明源，
                  // 那些用 XHR 取数据的 demo 会被跨域策略直接拒掉。
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
                />
              </div>
            ) : (
              <>
                {demo.files.length > 1 ? (
                  <div className="file-tabs">
                    {demo.files.map((file) => (
                      <button
                        type="button"
                        key={file.path}
                        className={file.path === activeFile ? 'file-tab file-tab--active' : 'file-tab'}
                        onClick={() => setActiveFile(file.path)}
                        title={file.path}
                      >
                        <FileIcon icon={resolveFileIcon(file.name)} size={14} />
                        {file.name}
                      </button>
                    ))}
                  </div>
                ) : null}

                {source.loading ? (
                  <div className="placeholder">正在读取源码…</div>
                ) : source.error ? (
                  <div className="placeholder placeholder--error">
                    <Icon name="warning" size={18} />
                    <div>
                      <strong>读不了这个文件</strong>
                      <p>{source.error}</p>
                    </div>
                  </div>
                ) : source.data ? (
                  <div className="source">
                    <div className="source__meta">
                      <span>{source.data.path}</span>
                      <span>
                        {formatBytes(source.data.bytes)}
                        {source.data.truncated ? '（已截断）' : ''}
                      </span>
                    </div>
                    <CodeView
                      code={source.data.text}
                      lang={langFromExt(activeFile.slice(activeFile.lastIndexOf('.')))}
                      highlighter={highlighter}
                    />
                  </div>
                ) : (
                  <div className="placeholder">这个文件不能以文本方式查看。</div>
                )}
              </>
            )}
          </div>
        </article>
      </div>

      <aside className="toc-col" />
    </>
  )
}
