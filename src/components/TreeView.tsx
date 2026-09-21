import { useState } from 'react'
import type { VaultNode } from '../../shared/types'
import { FileIcon, resolveFileIcon, resolveFolderIcon } from './FileIcon'
import { Icon } from './Icon'

interface TreeViewProps {
  nodes: VaultNode[]
  depth?: number
  expanded: Record<string, boolean>
  onToggle: (id: string) => void
  activeId: string | null
  onOpen: (node: VaultNode) => void
}

/** 文件夹右边的数字是「里面有多少东西」，递归数一次就缓存住 */
const leafCounts = new WeakMap<VaultNode, number>()

function countLeaves(node: VaultNode): number {
  const cached = leafCounts.get(node)
  if (cached !== undefined) return cached
  let total = 0
  for (const child of node.children ?? []) {
    total += child.kind === 'folder' ? countLeaves(child) : 1
  }
  leafCounts.set(node, total)
  return total
}

/** 笔记去掉 .md 后缀，读起来更像标题；demo 保留后缀，因为 index.html 去掉后缀就认不出来了 */
function displayName(node: VaultNode): string {
  return node.kind === 'note' ? node.name.replace(/\.md$/i, '') : node.name
}

interface FolderNodeProps extends Omit<TreeViewProps, 'nodes'> {
  node: VaultNode
  depth: number
}

function FolderNode({ node, depth, expanded, onToggle, activeId, onOpen }: FolderNodeProps) {
  const open = expanded[node.id] ?? false

  /**
   * 子树首次展开后才挂载，之后一直留着。
   *
   * 一直留着是为了让收起动画能播——一收起就卸载的话，容器瞬间变空，高度动画没有内容可动。
   * 首次展开才挂载是因为 Web 前端那棵树有 659 个 demo 叶子，全量挂载没有意义。
   * 这不是 useEffect：渲染期派生 state 是 React 认可的做法，比先渲染一帧空内容再补挂载少一次闪烁。
   */
  const [mounted, setMounted] = useState(open)
  if (open && !mounted) setMounted(true)

  return (
    <li>
      <button
        type="button"
        className="tree__row tree__row--folder"
        style={{ paddingLeft: 8 + depth * 13 }}
        aria-expanded={open}
        onClick={() => onToggle(node.id)}
      >
        <span className="chev">
          <Icon name="chevron" size={16} />
        </span>
        {/*
          两个图标叠着做交叉淡切：收起是闭合的文件夹，展开是打开的。
          都按真实文件夹名解析，所以 `img` 会拿到带图片标记的文件夹、`02_CSS` 拿到 CSS 的。
        */}
        <span className="tree__folder">
          <FileIcon
            icon={resolveFolderIcon(node.name, false)}
            size={15}
            className="tree__folder-closed"
          />
          <FileIcon
            icon={resolveFolderIcon(node.name, true)}
            size={15}
            className="tree__folder-open"
          />
        </span>
        <span className="tree__name">{node.name}</span>
        <span className="tree__count">{countLeaves(node)}</span>
      </button>

      <div className="branch" data-open={open ? '' : undefined}>
        <div className="branch__inner">
          {mounted && node.children ? (
            <TreeView
              nodes={node.children}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              activeId={activeId}
              onOpen={onOpen}
            />
          ) : null}
        </div>
      </div>
    </li>
  )
}

export function TreeView({
  nodes,
  depth = 0,
  expanded,
  onToggle,
  activeId,
  onOpen,
}: TreeViewProps) {
  return (
    <ul className="tree">
      {nodes.map((node) => {
        if (node.kind === 'folder') {
          return (
            <FolderNode
              key={node.id}
              node={node}
              depth={depth}
              expanded={expanded}
              onToggle={onToggle}
              activeId={activeId}
              onOpen={onOpen}
            />
          )
        }

        const active = node.id === activeId
        return (
          <li key={node.id}>
            <button
              type="button"
              className={active ? 'tree__row tree__row--active' : 'tree__row'}
              style={{ paddingLeft: 8 + depth * 13 }}
              title={node.path}
              onClick={() => onOpen(node)}
            >
              <span className="chev chev--spacer" />
              <FileIcon
                icon={resolveFileIcon(node.name)}
                size={15}
                className="tree__icon"
              />
              <span className="tree__name">{displayName(node)}</span>
              {node.sectionCount ? <span className="tree__count">{node.sectionCount}</span> : null}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
