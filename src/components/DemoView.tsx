import { useEffect, useRef, useState } from 'react'
import type { Highlighter } from 'shiki'
import { useDemo, useFile } from '../hooks/useContent'
import { formatBytes } from '../lib/format'
import { CodeView, langFromExt } from './CodeView'
import { CopyButton } from './CopyButton'
import { Icon } from './Icon'

/**
 * iframe 本体，带「载入完成才淡入」。
 *
 * iframe 一挂上就开始解析自己的文档，画出来之前是一块白（暗色主题下尤其扎眼，
 * 用户描述为"打开 html 页面后会突然闪一下"）。所以先藏着，onLoad 到了再淡入；
 * 重新加载按钮换 frameKey 重挂，这个状态跟着组件一起重置。
 */
function DemoFrame({ url, title }: { url: string; title: string }) {
  const [ready, setReady] = useState(false)
  return (
    <iframe
      className={ready ? 'frame__inner frame__inner--ready' : 'frame__inner'}
      src={url}
      title={title}
      loading="lazy"
      onLoad={() => setReady(true)}
      // allow-same-origin 是必需的：不带上它 iframe 会变成不透明源，
      // 那些用 XHR 取数据的 demo 会被跨域策略直接拒掉。
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
    />
  )
}

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
 * dev 模式：iframe 直接用 /@vault/ 下 demo 的真实路径，所以它里面的相对引用
 * （css/js/图片）全都能按原样解析——不用重写 HTML，也不用构建。
 *
 * 线上：`demo.url` 是 null（服务端生成的 payload 里就是 null），因为 demo 的运行素材
 * ——图片、字体、视频——没有上传到云端，iframe 跑起来只会是缺图少字的坏页面。
 * 这时只提供「看源码」。判断由服务端给，这里不猜。
 *
 * 「看源码」只看这个 HTML 自己，没有同目录文件的切换标签：相邻的 .js/.css 就在侧栏
 * 同一层里（它们现在都是树节点），从那里点开读到的是一整页，比在预览页顶上挤一排
 * 标签更清楚。
 */
export function DemoView({ sectionId, path, sectionName, highlighter, onOpenEntry }: DemoViewProps) {
  const { data: demo, error, loading } = useDemo(sectionId, path)
  const [tab, setTab] = useState<'preview' | 'source'>('preview')
  const [frameKey, setFrameKey] = useState(0)

  const onOpenEntryRef = useRef(onOpenEntry)
  onOpenEntryRef.current = onOpenEntry

  useEffect(() => {
    setTab('preview')
  }, [path])

  // payload 到了才知道这个环境能不能跑 demo（线上不能），这时把标签页切到源码
  useEffect(() => {
    if (demo && demo.url === null) setTab('source')
  }, [demo])

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

  const source = useFile(sectionId, path, tab === 'source')

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
  const canRun = demo.url !== null

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
                {canRun ? (
                  <button
                    type="button"
                    className={tab === 'preview' ? 'tab tab--active' : 'tab'}
                    onClick={() => setTab('preview')}
                  >
                    预览
                  </button>
                ) : null}
                <button
                  type="button"
                  className={tab === 'source' ? 'tab tab--active' : 'tab'}
                  onClick={() => setTab('source')}
                >
                  看源码
                </button>
              </div>
              {canRun ? (
                <>
                  <button type="button" className="btn btn--ghost" onClick={() => setFrameKey((k) => k + 1)}>
                    <Icon name="refresh" size={13} />
                    重新加载
                  </button>
                  <a className="btn btn--ghost" href={demo.url ?? '#'} target="_blank" rel="noreferrer">
                    <Icon name="external" size={13} />
                    新标签页打开
                  </a>
                </>
              ) : null}
            </div>

            {!canRun ? (
              <div className="notice notice--muted">
                <Icon name="warning" size={15} />
                <div>
                  <strong>这里只提供源码</strong>
                  <p>
                    这个 demo 的运行素材（图片、字体、视频）没有上传到云端，跑起来会是缺图少字体的坏页面，
                    所以线上只展示源码。想看它真正跑起来，在本地打开同一个 demo。
                  </p>
                </div>
              </div>
            ) : needsNetwork ? (
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
            {tab === 'preview' && demo.url !== null ? (
              <div className="frame">
                <DemoFrame key={frameKey} url={demo.url} title={demo.title} />
              </div>
            ) : (
              <>
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
                      <span className="source__actions">
                        <span>
                          {formatBytes(source.data.bytes)}
                          {source.data.truncated ? '（已截断）' : ''}
                        </span>
                        <CopyButton text={source.data.text} />
                      </span>
                    </div>
                    <CodeView
                      code={source.data.text}
                      lang={langFromExt(path.slice(path.lastIndexOf('.')))}
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
