import type { PublishLevel, VaultIndex, VaultNode, VaultSection } from '../../shared/types'
import type { RecentEntry } from '../hooks/useReadingState'
import type { ThemeState } from '../hooks/useTheme'
import { formatRelative } from '../lib/format'
import { FileIcon, resolveFolderIcon } from './FileIcon'
import { Icon, type IconName } from './Icon'
import { ThemeToggle } from './ThemeToggle'
import { TreeView } from './TreeView'

interface SidebarProps {
  index: VaultIndex
  /** 展开状态：键是 `section:<id>` 或节点 id */
  expanded: Record<string, boolean>
  activeId: string | null
  recent: RecentEntry[]
  theme: ThemeState
  onToggleTree: (id: string) => void
  onOpenNode: (sectionId: string, node: VaultNode) => void
  onOpenRecent: (entry: RecentEntry) => void
  onOpenSearch: () => void
  /** 收起侧栏（桌面）／关闭抽屉（窄屏）——两种情况都是同一个动作 */
  onCollapse: () => void
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
  theme,
  onToggleTree,
  onOpenNode,
  onOpenRecent,
  onOpenSearch,
  onCollapse,
}: SidebarProps) {
  const activeSectionId = activeId?.split(':')[0] ?? null

  return (
    <div className="sidebar__inner">
      <header className="sidebar__head">
        <div className="sidebar__brand">
          <span className="sidebar__title">MioNote</span>
        </div>
        <div className="sidebar__tools">
          <ThemeToggle isDark={theme.isDark} onToggle={theme.toggle} />
          <button type="button" className="icon-btn" title="收起侧栏（Ctrl+B）" onClick={onCollapse}>
            <Icon name="collapse" size={16} />
          </button>
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
    </div>
  )
}
