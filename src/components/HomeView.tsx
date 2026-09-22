import type { VaultIndex, VaultNode, VaultSection } from '../../shared/types'
import type { RecentEntry } from '../hooks/useReadingState'
import { formatRelative } from '../lib/format'
import { FileIcon, resolveFileIcon, resolveFolderIcon } from './FileIcon'
import { Icon } from './Icon'

interface HomeViewProps {
  index: VaultIndex
  recent: RecentEntry[]
  onOpenSection: (sectionId: string, node: VaultNode) => void
  onOpenRecent: (entry: RecentEntry) => void
  /** 带上鼠标位置：搜索面板从那一点长出来（同侧栏那个搜索按钮） */
  onOpenSearch: (event: { clientX: number; clientY: number }) => void
}

/** 一个文件夹里第一篇可读的东西，用来做「点进去看看」 */
function firstReadable(nodes: VaultNode[]): VaultNode | null {
  for (const node of nodes) {
    if (node.kind !== 'folder') return node
    const nested = firstReadable(node.children ?? [])
    if (nested) return nested
  }
  return null
}

function PublishNote({ section }: { section: VaultSection }) {
  if (section.publish === 'never') {
    return (
      <p className="card__publish card__publish--never">
        <Icon name="block" size={13} />
        永不发布：这个文件夹里是敏感内容，只有本地阅读器能读
      </p>
    )
  }
  if (section.publish === 'private') {
    return (
      <p className="card__publish">
        <Icon name="lock" size={13} />
        发布时需登录才能读
      </p>
    )
  }
  return (
    <p className="card__publish">
      <Icon name="public" size={13} />
      允许发布到云端
    </p>
  )
}

export function HomeView({ index, recent, onOpenSection, onOpenRecent, onOpenSearch }: HomeViewProps) {
  return (
    <>
      <div className="reader">
        <article className="doc doc--home">
          <header className="doc__head">
            <h1 className="doc__title">MioNote</h1>
            <div className="doc__actions">
              <button type="button" className="btn" onClick={onOpenSearch}>
                <Icon name="search" size={14} />
                搜索全部笔记
                <kbd>Ctrl K</kbd>
              </button>
            </div>
          </header>

          {recent.length > 0 ? (
            <section className="home__block">
              <h2 className="home__h2">接着上次</h2>
              <ul className="home__recent">
                {recent.slice(0, 6).map((entry) => (
                  <li key={entry.id}>
                    <button type="button" className="home__recent-item" onClick={() => onOpenRecent(entry)}>
                      <FileIcon icon={resolveFileIcon(entry.path)} size={15} />
                      <span className="home__recent-title">{entry.title}</span>
                      <span className="home__recent-time">{formatRelative(entry.at)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="home__block">
            <h2 className="home__h2">笔记文件夹</h2>
            <div className="cards">
              {index.sections.map((section) => {
                const target = firstReadable(section.children)
                return (
                  <button
                    type="button"
                    className="card"
                    key={section.id}
                    disabled={!section.available || !target}
                    onClick={() => target && onOpenSection(section.id, target)}
                  >
                    <div className="card__top">
                      <span className="card__name">
                        <FileIcon
                          icon={section.icon ?? resolveFolderIcon(section.name, false)}
                          size={16}
                          className="card__icon"
                        />
                        {section.name}
                      </span>
                    </div>
                    <PublishNote section={section} />
                  </button>
                )
              })}
            </div>
          </section>
        </article>
      </div>

      <aside className="toc-col" />
    </>
  )
}
