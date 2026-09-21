import { useState } from 'react'
import type { PublishLevel, VaultIndex, VaultNode, VaultSection } from '../../shared/types'
import type { RecentEntry } from '../hooks/useReadingState'
import type { ThemeChoice } from '../hooks/useTheme'
import { formatBytes, formatRelative } from '../lib/format'
import { FileIcon, resolveFolderIcon } from './FileIcon'
import { Icon, type IconName } from './Icon'
import { TreeView } from './TreeView'

interface SidebarProps {
  index: VaultIndex
  /** 展开状态：键是 `section:<id>` 或节点 id */
  expanded: Record<string, boolean>
  activeId: string | null
  recent: RecentEntry[]
  themeChoice: ThemeChoice
  onToggleTree: (id: string) => void
  onOpenNode: (sectionId: string, node: VaultNode) => void
  onOpenRecent: (entry: RecentEntry) => void
  onOpenSearch: () => void
  onCycleTheme: () => void
  onRescan: () => void
  rescanning: boolean
  onClose?: () => void
}

function PublishBadge({ level }: { level: PublishLevel }) {
  const config: { icon: IconName; label: string; className: string; title: string } =
    level === 'public'
      ? {
          icon: 'public',
          label: '公开',
          className: 'badge badge--public',
          title: '会发布到云端，任何人可读',
        }
      : level === 'private'
        ? {
            icon: 'lock',
            label: '需登录',
            className: 'badge badge--private',
            title: '会发布到云端，但需要登录才能读（这一版还没实现鉴权）',
          }
        : {
            icon: 'block',
            label: '不发布',
            className: 'badge badge--never',
            title: '永不发布，只在这个本地阅读器里读得到',
          }

  return (
    <span className={config.className} title={config.title}>
      <Icon name={config.icon} size={12} />
      {config.label}
    </span>
  )
}

export function Sidebar({
  index,
  expanded,
  activeId,
  recent,
  themeChoice,
  onToggleTree,
  onOpenNode,
  onOpenRecent,
  onOpenSearch,
  onCycleTheme,
  onRescan,
  rescanning,
  onClose,
}: SidebarProps) {
  const [showIssues, setShowIssues] = useState(false)
  const activeSectionId = activeId?.split(':')[0] ?? null

  const themeLabel =
    themeChoice === 'light' ? '浅色' : themeChoice === 'dark' ? '深色' : '跟随系统'

  return (
    <div className="sidebar__inner">
      <header className="sidebar__head">
        <div className="sidebar__brand">
          <span className="sidebar__title">MioNote</span>
          <span className="sidebar__subtitle">
            {index.stats.notes} 篇笔记 · {formatBytes(index.stats.noteBytes)}
          </span>
        </div>
        <div className="sidebar__tools">
          <button type="button" className="icon-btn" title={`主题：${themeLabel}（点击切换）`} onClick={onCycleTheme}>
            <Icon name="theme" size={16} />
          </button>
          <button
            type="button"
            className="icon-btn"
            title="重新扫描笔记文件夹"
            onClick={onRescan}
            disabled={rescanning}
          >
            <Icon name="refresh" size={16} className={rescanning ? 'spin' : undefined} />
          </button>
          {onClose ? (
            <button type="button" className="icon-btn" title="关闭侧栏" onClick={onClose}>
              <Icon name="close" size={16} />
            </button>
          ) : null}
        </div>
      </header>

      <button type="button" className="search-trigger" onClick={onOpenSearch}>
        <Icon name="search" size={16} />
        <span>搜索全部笔记</span>
        <kbd>Ctrl K</kbd>
      </button>

      {recent.length > 0 ? (
        <section className="recent">
          <div className="recent__head">最近打开</div>
          <ul className="recent__list">
            {recent.slice(0, 5).map((entry) => (
              <li key={entry.id}>
                <button type="button" className="recent__item" onClick={() => onOpenRecent(entry)}>
                  <span className="recent__title">{entry.title}</span>
                  <span className="recent__time">{formatRelative(entry.at)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <nav className="sections">
        {index.sections.map((section: VaultSection) => {
          const groupId = `section:${section.id}`
          // 「第一次打开时展开第一个文件夹」由 App 播种进 localStorage，
          // 这里只负责读，别在这里再写一套默认值——两处默认会让折叠按钮失效
          const open = expanded[groupId] ?? false
          return (
            <div className={activeSectionId === section.id ? 'section section--active' : 'section'} key={section.id}>
              <div className="section__head">
                <button
                  type="button"
                  className="section__toggle"
                  aria-expanded={open}
                  onClick={() => onToggleTree(groupId)}
                >
                  <span className="chev">
                    <Icon name="chevron" size={16} />
                  </span>
                  <FileIcon
                    icon={section.icon ?? resolveFolderIcon(section.name, false)}
                    size={15}
                    className="section__icon"
                  />
                  <span className="section__name">{section.name}</span>
                  <span className="section__counts">
                    {section.counts.notes}
                    {section.counts.demos > 0 ? ` · ${section.counts.demos} demo` : ''}
                  </span>
                </button>
                <PublishBadge level={section.publish} />
              </div>

              <div className="branch branch--section" data-open={open ? '' : undefined}>
                <div className="branch__inner">
                  {section.children.length > 0 ? (
                    <TreeView
                      nodes={section.children}
                      expanded={expanded}
                      onToggle={onToggleTree}
                      activeId={activeId}
                      onOpen={(node) => onOpenNode(section.id, node)}
                    />
                  ) : (
                    <p className="section__empty">{section.available ? '没有笔记' : '目录不存在'}</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </nav>

      <footer className="sidebar__foot">
        <div className="stats">
          <span>
            笔记 {index.stats.notes} · demo {index.stats.demos}
          </span>
          <span>扫描 {index.scanMs} ms</span>
        </div>

        {index.stats.missingAssets.length > 0 ? (
          <div className="issues">
            <button
              type="button"
              className="issues__toggle"
              aria-expanded={showIssues}
              onClick={() => setShowIssues((v) => !v)}
            >
              <Icon name="warning" size={13} />
              {index.stats.missingAssets.length} 张图找不到
              <span className="issues__caret">{showIssues ? '收起' : '查看'}</span>
            </button>
            <div className="branch" data-open={showIssues ? '' : undefined}>
              <div className="branch__inner">
                <ul className="issues__list">
                  {index.stats.missingAssets.map((item) => (
                    <li key={`${item.section}:${item.note}:${item.ref}`}>
                      <span className="issues__note">{item.note}</span>
                      <code>{item.ref}</code>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : null}

        {index.warnings
          .filter((warning) => !warning.includes('图片引用'))
          .map((warning) => (
            <p className="sidebar__warning" key={warning}>
              <Icon name="warning" size={13} /> {warning}
            </p>
          ))}
      </footer>
    </div>
  )
}
