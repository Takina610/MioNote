import {
  DEFAULT_FILE_ICON,
  DEFAULT_FOLDER_ICON,
  DEFAULT_FOLDER_OPEN_ICON,
  EXTENSION_ICONS,
  FILENAME_ICONS,
  FOLDER_ALIASES,
  FOLDER_ICONS,
  FOLDER_ICONS_OPEN,
  ICONS,
} from '../generated/icons'

/**
 * 文件和文件夹图标（Material Icon Theme）。
 *
 * 这套图标是彩色的——`.md` 是蓝的、`.html` 是橙的、`.vue` 是绿的，
 * 所以侧栏扫一眼就能区分文件类型。颜色写在图形的 fill 上，
 * 因此下面那套 `color` 相关的 CSS 对这些图标不起作用，这是有意的。
 */

const MATERIAL_PREFIX = 'material:'

/** 展开态图标名：`folder-css` → `folder-css-open`，没有展开态就用原图标 */
function openVariant(icon: string): string {
  const open = `${icon}-open`
  return ICONS[MATERIAL_PREFIX + open] ? open : icon
}

/**
 * 文件名 → 图标名。三级回退：精确文件名 → 扩展名 → 默认文档图标。
 * 精确文件名优先是因为 `package.json` 该显示 Node 图标而不是普通的 JSON 图标。
 */
export function resolveFileIcon(fileName: string): string {
  const lower = fileName.toLowerCase()

  const byName = FILENAME_ICONS[lower]
  if (byName) return byName

  const dot = lower.lastIndexOf('.')
  if (dot >= 0 && dot < lower.length - 1) {
    const byExt = EXTENSION_ICONS[lower.slice(dot + 1)]
    if (byExt) return byExt
  }

  return DEFAULT_FILE_ICON
}

/**
 * 关键词匹配用的 token 表，按长度从长到短。
 *
 * 只收长度 2~24 且不含数字的名字（数字 token 是 `01`、`v2` 这种噪音）。
 * 长 token 优先是为了让 `javascript` 赢过 `java`。
 */
const FOLDER_KEYWORDS = Object.keys(FOLDER_ICONS)
  .filter((token) => token.length >= 2 && token.length <= 24 && !/[0-9]/.test(token))
  .sort((a, b) => b.length - a.length)

/** 从名字里切出连续的英文/数字词块：`01-CSS的编写位置` → ['css'] */
function latinRuns(value: string): string[] {
  return value.match(/[a-z0-9]+/g) ?? []
}

/**
 * 在词块里找一个已知 token。
 *
 * 只做「整词相等」和「词首匹配」两种判断，**不做子串包含**——
 * 子串包含会踩这种坑：`axios` 里含 `ios`（→ 被当成 iOS 文件夹）、
 * `routerlink` 里含 `out`（→ 被当成输出目录）。按词块判断不会有这个问题。
 */
function matchKeyword(runs: string[]): string | null {
  // 先整词相等：`javascript` 该匹配 javascript 而不是被 java 抢先
  for (const run of runs) {
    const exact = FOLDER_ICONS[run]
    if (exact) return exact
  }
  // 再词首匹配：`nodemon` → node、`css3` → css、`jsx` → js
  for (const run of runs) {
    for (const token of FOLDER_KEYWORDS) {
      const compact = token.replace(/[-_.\s]+/g, '')
      if (compact.length < 2 || compact.length > run.length) continue
      if (run.startsWith(compact)) return FOLDER_ICONS[token]
    }
  }
  return null
}

/**
 * 文件夹名 → 图标名。四层回退，因为你的目录名很杂：
 * 既有 `img` 这种 manifest 直接认识的，也有 `02_CSS`、`09_Node.js` 这种带编号前缀的，
 * 还有 `笔记`、`01-CSS的编写位置` 这种中文的。
 *
 *   1. 精确匹配        img                 → folder-images
 *   2. 中文别名        笔记                 → folder-docs
 *   3. 去掉编号前缀     02_CSS / 09_Node.js  → folder-css / folder-node
 *   4. 词块匹配        01-CSS的编写位置      → folder-css
 *   5. 都没有 → Material 的默认灰文件夹（VS Code 也是这个行为，本身不难看）
 */
export function resolveFolderIcon(folderName: string, open: boolean): string {
  const map = open ? FOLDER_ICONS_OPEN : FOLDER_ICONS
  const lower = folderName.toLowerCase()

  // 1. 精确
  const exact = map[lower]
  if (exact) return exact

  // 2. 中文别名（表里存的是收起态名字，展开态现算）
  const alias = FOLDER_ALIASES[folderName.trim()] ?? FOLDER_ALIASES[lower]
  if (alias) {
    const icon = open ? openVariant(alias) : alias
    if (ICONS[MATERIAL_PREFIX + icon]) return icon
  }

  const runs = latinRuns(lower)

  // 3. 去掉前导编号后，用剩下的整串和词块各查一遍
  //    （`09_Node.js` 去掉编号后是 `node.js`，在表里直接就能查到）
  const stripped = lower.replace(/^[0-9]+[-_.\s]+/, '')
  if (stripped !== lower) {
    for (const candidate of [stripped, stripped.replace(/[-_.\s]+/g, ''), ...runs]) {
      const hit = map[candidate]
      if (hit) return hit
    }
  }

  // 4. 词块匹配
  const byKeyword = matchKeyword(runs)
  if (byKeyword) {
    const icon = open ? openVariant(byKeyword) : byKeyword
    if (ICONS[MATERIAL_PREFIX + icon]) return icon
  }

  return open ? DEFAULT_FOLDER_OPEN_ICON : DEFAULT_FOLDER_ICON
}

interface FileIconProps {
  /** 已解析出的图标名 */
  icon: string
  size?: number
  className?: string
}

/** 按图标名渲染。图标名来自上面两个 resolve 函数。 */
export function FileIcon({ icon, size = 16, className }: FileIconProps) {
  const data = ICONS[MATERIAL_PREFIX + icon]
  if (!data) return null

  return (
    <svg
      className={className ? `icon ${className}` : 'icon'}
      width={size}
      height={size}
      viewBox={data.viewBox}
      // 彩色图标自带 fill；万一某个图标没有，这里让它跟随文字颜色
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      // 内容由 scripts/generate-icons.mjs 在构建时生成并做了元素/属性白名单过滤，
      // 而且 id 已经加了图标前缀，多个图标内联也不会互相污染。
      dangerouslySetInnerHTML={{ __html: data.body }}
    />
  )
}

/** 文件名的便捷写法：一步到位 */
export function FileNameIcon({ name, size = 16, className }: { name: string; size?: number; className?: string }) {
  return <FileIcon icon={resolveFileIcon(name)} size={size} className={className} />
}
