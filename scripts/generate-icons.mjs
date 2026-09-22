/**
 * 生成 src/generated/icons.ts。
 *
 * 两套图标，跟 VS Code 自己的做法一致：
 *   · 文件和文件夹图标 —— material-icon-theme（彩色，VS Code 里那套文件图标主题）
 *   · 界面图标         —— @vscode/codicons（单色，VS Code 界面自己的图标）
 *
 * Material Icon Theme 的完整映射表是 450 KB、1251 个图标，全塞进浏览器不合理。
 * 所以这里把「可能出现的东西」筛成一个允许清单，只内联这些图标
 * （约 200 个，源文件 250 KB，gzip 后 45 KB）。
 *
 * 这个脚本还负责三件容易出错的事：
 *   1. 白名单过滤元素和属性 —— 生成的 SVG 片段在构造上就是安全的，
 *      渲染时可以直接注入，不需要再依赖运行时过滤。
 *   2. 给 id 加图标前缀 —— 117 个图标自带 id，全部内联到同一个文档里会互相冲突
 *      （folder-css 就是靠 <defs> + <use href="#a"> 画的）。
 *   3. 解析不到的图标名全部报出来，不漏。
 *
 * 重新生成：bun run icons
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const manifest = require('material-icon-theme/dist/material-icons.json')

const MATERIAL_DIR = path.dirname(require.resolve('material-icon-theme/package.json'))
const MATERIAL_ICONS = path.join(MATERIAL_DIR, 'icons')
const CODICON_ICONS = path.join(
  path.dirname(require.resolve('@vscode/codicons/package.json')),
  'src',
  'icons',
)

/* ------------------------------------------------------------------ 输入清单 */

/** 界面图标（codicons）。语义名 → codicon 文件名，调用处只用语义名。 */
const CHROME = {
  chevron: 'chevron-right',
  search: 'search',
  refresh: 'refresh',
  theme: 'color-mode',
  close: 'close',
  menu: 'menu',
  external: 'link-external',
  warning: 'warning',
  lock: 'lock',
  public: 'globe',
  block: 'circle-slash',
  check: 'check',
  copy: 'copy',
  link: 'link',
  filter: 'list-filter',
  collapse: 'chevron-left',
}

/**
 * 文件扩展名。覆盖 vault.config.ts 里声明过的全部类型，外加常见的一批——
 * 宁可多带几个空转的映射（每个几百字节），也不要新加一个文件夹就出现默认灰图标。
 */
const EXTENSIONS = [
  // 笔记与文档
  'md', 'markdown', 'mdx', 'txt', 'pdf', 'doc', 'docx', 'rtf',
  // Web
  'html', 'htm', 'css', 'scss', 'sass', 'less', 'styl', 'vue', 'svelte',
  'js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx', 'json', 'jsonl', 'json5', 'map', 'wasm',
  // 后端 / 系统
  'java', 'cs', 'py', 'go', 'rs', 'php', 'rb', 'swift', 'kt', 'c', 'cpp', 'h', 'hpp',
  'sql', 'sh', 'bash', 'ps1', 'bat', 'cmd', 'lua', 'pl', 'r', 'dart', 'graphql', 'proto',
  // 配置与数据
  'yml', 'yaml', 'toml', 'ini', 'conf', 'cfg', 'env', 'xml', 'properties', 'lock', 'log',
  // 资源
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'bmp', 'ico', 'svg', 'dpg',
  'woff', 'woff2', 'ttf', 'otf', 'eot',
  'mp3', 'wav', 'mp4', 'webm', 'mov', 'zip', '7z', 'rar', 'gz', 'exe', 'dll', 'pdb', 'suo', 'db',
  // 模板与杂项
  'pug', 'ejs', 'hbs', 'twig', 'liquid', 'gitignore', 'npmrc', 'editorconfig', 'prettierrc',
]

/** 精确文件名。这些用材料图标比按扩展名更准确（package.json 是 Node 图标之类）。 */
const FILENAMES = [
  'package.json', 'package-lock.json', 'bun.lock', 'bun.lockb', 'yarn.lock', 'pnpm-lock.yaml',
  'tsconfig.json', 'vite.config.ts', 'vite.config.js', 'vitest.config.ts',
  'readme.md', 'README.md', 'license', 'LICENSE', 'changelog.md', 'CHANGELOG.md',
  '.gitignore', '.gitattributes', '.gitmodules', '.npmrc', '.editorconfig', '.env',
  '.prettierrc', '.prettierignore', '.eslintrc', '.eslintignore', '.babelrc', '.nvmrc',
  'dockerfile', 'Dockerfile', 'makefile', 'Makefile', 'index.html', 'index.js', 'index.ts',
  'main.js', 'main.ts', 'main.tsx', 'app.vue', 'app.tsx', 'app.jsx',
]

/**
 * 文件夹图标允许清单。
 * 只列出这些图标 → 脚本会把 manifest 里所有指向它们的文件夹名一起带进来
 * （1635 个键，纯字符串），所以 `node_modules`、`dist`、`src`、`test`
 * 这些常见名字不用一个个写。
 */
const FOLDER_ICON_ALLOWLIST = [
  'folder', 'folder-open',
  'folder-views', 'folder-css', 'folder-less', 'folder-sass', 'folder-javascript',
  'folder-typescript', 'folder-vue', 'folder-angular', 'folder-node', 'folder-markdown',
  'folder-examples', 'folder-docs', 'folder-images', 'folder-font', 'folder-audio',
  'folder-video', 'folder-database', 'folder-api', 'folder-resource', 'folder-components',
  'folder-layout', 'folder-lib', 'folder-utils', 'folder-config', 'folder-scripts',
  'folder-python', 'folder-java', 'folder-android', 'folder-ios', 'folder-linux',
  'folder-windows', 'folder-git', 'folder-vscode', 'folder-dist', 'folder-test',
  'folder-temp', 'folder-cart', 'folder-debug', 'folder-home', 'folder-secure',
  'folder-keys', 'folder-server', 'folder-cloudflare', 'folder-target', 'folder-theme',
  'folder-content', 'folder-public', 'folder-client', 'folder-store', 'folder-core',
  'folder-interface', 'folder-mock', 'folder-directive', 'folder-gulp', 'folder-webpack',
  'folder-json', 'folder-gradle', 'folder-docker',
  // 侧栏 7 个笔记文件夹用的：`folder-i18n` 是「文A」翻译字形（给日语），
  // `folder-src` 是 `</>`（给 C#），`folder-keys` 是钥匙（Xray 里放着 SSH 私钥）
  'folder-src', 'folder-i18n',
]

/**
 * manifest 覆盖不到的名字（主要是中文）。
 * Material Icon Theme 只认英文 token，这些得手工补——不然 `笔记` 会掉到默认图标上。
 */
const FOLDER_ALIASES = {
  笔记: 'folder-docs',
  图片: 'folder-images',
  素材: 'folder-images',
  资源: 'folder-resource',
  文档: 'folder-docs',
  练习: 'folder-examples',
  案例: 'folder-examples',
  作业: 'folder-examples',
  面试: 'folder-target',
  考试: 'folder-docs',
  日语: 'folder-content',
  代码: 'folder-scripts',
  后端: 'folder-server',
  前端: 'folder-client',
  杂项: 'folder-temp',
}

/* -------------------------------------------------------------- SVG 白名单 */

/**
 * 允许出现在生成产物里的元素。
 * 实测这批图标用到的就是这些；不在表里的元素会被整段丢掉并报警。
 */
const ALLOWED_ELEMENTS = new Set([
  'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon',
  'g', 'defs', 'use', 'linearGradient', 'radialGradient', 'stop', 'title',
])

/**
 * 允许出现在生成产物里的属性。
 * `on*` 之类一律不在表里，所以生成结果里不可能出现事件处理器。
 */
const ALLOWED_ATTRS = new Set([
  'd', 'fill', 'fill-rule', 'clip-rule', 'opacity', 'stroke', 'stroke-width',
  'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray',
  'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'width', 'height',
  'x1', 'y1', 'x2', 'y2', 'points', 'offset', 'stop-color', 'stop-opacity',
  'transform', 'gradientUnits', 'gradientTransform', 'spreadMethod',
  'id', 'href', 'xlink:href', 'viewBox',
])

const problems = []

/**
 * 把一个 SVG 文件处理成可安全内联的片段。
 *
 * 做三件事：取出 viewBox；白名单过滤元素与属性；给 id 和内部引用加图标前缀
 * （不同图标里的 `id="a"` 内联到同一份文档会互相覆盖）。
 */
function parseSvg(source, key) {
  const viewBox = /viewBox="([^"]+)"/.exec(source)?.[1]
  if (!viewBox) {
    problems.push(`${key}：没有 viewBox`)
    return null
  }

  const prefix = `${key.replace(/[^a-zA-Z0-9_-]/g, '-')}--`
  const inner = source
    .replace(/<\?xml[\s\S]*?\?>/g, '')
    .replace(/<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')

  let dropped = []
  const body = inner.replace(
    /<(\/?)([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g,
    (_match, closing, tag, rawAttrs, selfClosing) => {
      if (!ALLOWED_ELEMENTS.has(tag)) {
        dropped.push(tag)
        return ''
      }

      // 闭合标签没什么可过滤的，直接重发
      if (closing === '/') return `</${tag}>`

      const kept = []
      const attrRe = /([a-zA-Z][\w:.-]*)\s*=\s*"([^"]*)"/g
      let attr
      while ((attr = attrRe.exec(rawAttrs)) !== null) {
        const name = attr[1]
        let value = attr[2]
        if (!ALLOWED_ATTRS.has(name)) {
          // data-* 是图标主题自己的元数据（比如 data-mit-no-recolor），不用带进产物
          if (!name.startsWith('data-')) dropped.push(`${tag}@${name}`)
          continue
        }
        // id 与内部引用加前缀，避免多个图标内联后互相覆盖
        if (name === 'id') value = prefix + value
        else if ((name === 'href' || name === 'xlink:href') && value.startsWith('#')) {
          value = `#${prefix}${value.slice(1)}`
        }
        kept.push(`${name}="${value}"`)
      }

      // 用 href 而不是 xlink:href：现代浏览器都支持，产物更干净
      const attrs = kept.join(' ').replace(/\sxlink:href=/g, ' href=')
      return `<${tag}${attrs ? ' ' + attrs : ''}${selfClosing ? '/' : ''}>`
    },
  )

  if (dropped.length > 0) {
    problems.push(`${key}：丢弃了 ${[...new Set(dropped)].join(', ')}`)
  }

  const hasExplicitFill = /fill="(?!currentColor|none)/.test(body)
  return { viewBox, body: body.trim(), hasExplicitFill }
}

function readMaterialIcon(name) {
  const file = path.join(MATERIAL_ICONS, `${name}.svg`)
  if (!fs.existsSync(file)) {
    problems.push(`material 图标不存在：${name}`)
    return null
  }
  return parseSvg(fs.readFileSync(file, 'utf8'), `material:${name}`)
}

function readCodicon(name) {
  const file = path.join(CODICON_ICONS, `${name}.svg`)
  if (!fs.existsSync(file)) {
    problems.push(`codicon 不存在：${name}`)
    return null
  }
  return parseSvg(fs.readFileSync(file, 'utf8'), `codicon:${name}`)
}

/* ------------------------------------------------------------------ 组数据 */

const icons = {}
function register(key, data) {
  if (!data || icons[key]) return
  icons[key] = {
    viewBox: data.viewBox,
    body: data.body,
    colored: data.hasExplicitFill,
  }
}

// 1) 界面图标（codicons）
const chromeOut = {}
for (const [semantic, codicon] of Object.entries(CHROME)) {
  const key = `codicon:${codicon}`
  register(key, readCodicon(codicon))
  if (icons[key]) chromeOut[semantic] = key
}

// 2) 扩展名 → 图标名
const usedIcons = new Set()
const extensionsOut = {}
for (const ext of EXTENSIONS) {
  const icon = manifest.fileExtensions[ext]
  if (!icon) continue
  extensionsOut[ext] = icon
  usedIcons.add(icon)
}

// 3) 精确文件名 → 图标名
const filenamesOut = {}
for (const name of FILENAMES) {
  const icon = manifest.fileNames[name] ?? manifest.fileNames[name.toLowerCase()]
  if (!icon) continue
  filenamesOut[name] = icon
  usedIcons.add(icon)
}

// 4) 文件夹名 → 图标名（允许清单反向收集）
//    展开态叫 `folder-xxx-open`，判断时把 `-open` 后缀剥掉再和允许清单比对。
const allowSet = new Set(FOLDER_ICON_ALLOWLIST)
function isAllowedFolderIcon(icon) {
  if (allowSet.has(icon)) return true
  const base = icon.replace(/-open$/, '')
  if (allowSet.has(base)) {
    allowSet.add(icon)
    return true
  }
  return false
}

const foldersOut = {}
const foldersOpenOut = {}
for (const [name, icon] of Object.entries(manifest.folderNames)) {
  if (!isAllowedFolderIcon(icon)) continue
  foldersOut[name] = icon
  usedIcons.add(icon)
}
for (const [name, icon] of Object.entries(manifest.folderNamesExpanded)) {
  if (!isAllowedFolderIcon(icon)) continue
  foldersOpenOut[name] = icon
  usedIcons.add(icon)
}

// 5) 中文别名
const aliasesOut = {}
for (const [name, icon] of Object.entries(FOLDER_ALIASES)) {
  if (!manifest.iconDefinitions[icon]) {
    problems.push(`别名指向的图标不存在：${name} → ${icon}`)
    continue
  }
  aliasesOut[name] = icon
  usedIcons.add(icon)
}

// 6) 默认图标 + 内联上面用到的全部 material 图标
const defaultFile = manifest.file
const defaultFolder = manifest.folder
const defaultFolderOpen = manifest.folderExpanded
usedIcons.add(defaultFile)
usedIcons.add(defaultFolder)
usedIcons.add(defaultFolderOpen)

for (const icon of [...usedIcons].sort()) {
  register(`material:${icon}`, readMaterialIcon(icon))
}

/* ------------------------------------------------------------------ 写文件 */

const outDir = path.join(process.cwd(), 'src', 'generated')
fs.mkdirSync(outDir, { recursive: true })

const json = (value) => JSON.stringify(value, null, 2)

const text = `/* eslint-disable */
/**
 * 由 scripts/generate-icons.mjs 自动生成，不要手改。
 * 重新生成：bun run icons
 *
 * 图标来源：
 *   · material-icon-theme（MIT）—— 文件和文件夹图标，彩色
 *   · @vscode/codicons（CC-BY-4.0）—— 界面图标，单色
 *
 * body 里的内容已经在生成时做过白名单过滤（元素、属性都限定在允许集合内），
 * 并且给 id 加了图标前缀，所以可以安全地整段内联到文档里。
 */

export interface IconData {
  /** 画布尺寸每个图标不同：material 文件图标 0 0 32 32，文件夹 0 0 16 16，codicon 0 0 16 16 */
  viewBox: string
  /** 经过白名单过滤的 SVG 片段 */
  body: string
  /** 是否自带颜色。false 表示它跟随 currentColor */
  colored: boolean
}

export const ICONS: Record<string, IconData> = ${json(icons)}

/** 界面图标：语义名 → 图标键 */
export const CHROME_ICONS = ${json(chromeOut)} as const

/** 扩展名（不含点）→ 图标名 */
export const EXTENSION_ICONS: Record<string, string> = ${json(extensionsOut)}

/** 精确文件名（小写）→ 图标名 */
export const FILENAME_ICONS: Record<string, string> = ${json(filenamesOut)}

/** 文件夹名（小写）→ 图标名 */
export const FOLDER_ICONS: Record<string, string> = ${json(foldersOut)}

/** 文件夹名（小写）→ 展开态图标名 */
export const FOLDER_ICONS_OPEN: Record<string, string> = ${json(foldersOpenOut)}

/** 中文等 manifest 覆盖不到的文件夹名别名 */
export const FOLDER_ALIASES: Record<string, string> = ${json(aliasesOut)}

export const DEFAULT_FILE_ICON = ${json(defaultFile)}
export const DEFAULT_FOLDER_ICON = ${json(defaultFolder)}
export const DEFAULT_FOLDER_OPEN_ICON = ${json(defaultFolderOpen)}
`

const outFile = path.join(outDir, 'icons.ts')
fs.writeFileSync(outFile, text)

/* ------------------------------------------------------------------ 报告 */

const bytes = Buffer.byteLength(text, 'utf8')
const monochrome = Object.values(icons).filter((data) => !data.colored).length

console.log(`已生成 ${path.relative(process.cwd(), outFile)}`)
console.log(`  界面图标 ${Object.keys(chromeOut).length} 个，全部单色`)
console.log(`  material 图标 ${Object.keys(icons).length - Object.keys(chromeOut).length} 个`)
console.log(`    · 自带颜色 ${Object.keys(icons).length - monochrome} 个，跟随文字颜色 ${monochrome - Object.keys(chromeOut).length} 个`)
console.log(`  映射：扩展名 ${Object.keys(extensionsOut).length} · 文件名 ${Object.keys(filenamesOut).length} · 文件夹 ${Object.keys(foldersOut).length}（展开态 ${Object.keys(foldersOpenOut).length}）· 别名 ${Object.keys(aliasesOut).length}`)
console.log(`  产物体积 ${(bytes / 1024).toFixed(1)} KB`)

if (problems.length > 0) {
  console.log()
  console.log(`  ⚠ ${problems.length} 个问题：`)
  for (const p of problems) console.log('    ' + p)
  process.exitCode = 1
}
