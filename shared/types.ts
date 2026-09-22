/**
 * MioNote 的内容模型。
 *
 * 这一层是三个平台（本地浏览器 / Tauri 桌面 / 云端静态站）共用的契约：
 * 无论内容从哪儿来——Vite 中间件读磁盘、Tauri 走 IPC、云端读静态 JSON——
 * 吐出来的都是这些形状，React 侧一行都不用改。
 */

/** 发布级别。默认不发布（fail-closed）：新增的文件夹在没人显式放行前不会上云。 */
export type PublishLevel = 'public' | 'private' | 'never'

export interface VaultSectionConfig {
  /** 稳定标识，会出现在 URL 里，改了就断链 */
  id: string
  /** 界面显示名 */
  name: string
  /** 笔记文件夹的绝对路径 */
  root: string
  /** 是否允许发布到云端。'never' 的文件夹连私有上云都不上，只在本地读 */
  publish: PublishLevel
  /** 给未来的自己看的备注，会显示在界面上 */
  note?: string
  /**
   * 侧栏和首页用的图标名（Material Icon Theme 的名字，比如 `folder-docs`）。
   * 不写的话按文件夹名自动解析——中文名通常解析不出来，这种时候写一个更省事。
   */
  icon?: string
}

export interface VaultConfig {
  sections: VaultSectionConfig[]
  /** 目录名命中就直接不往下走 */
  ignoreDirs: string[]
  /** 文件名命中就跳过（README.md 会整批隐藏） */
  ignoreFiles: string[]
  /** 当作可预览 demo 的扩展名 */
  demoExtensions: string[]
  /** 可作为源码查看的文本扩展名 */
  codeExtensions: string[]
  /** 单个源码文件超过这个大小就不给看，防止把几百 KB 的 bundle 塞进浏览器 */
  maxCodeBytes: number
}

/** 树节点只有三种：文件夹、笔记、demo。图片之类的资源不进树，只在正文里引用。 */
export type VaultNodeKind = 'folder' | 'note' | 'demo'

export interface VaultNode {
  kind: VaultNodeKind
  /** `${sectionId}:${section 内相对路径}`，全站唯一，也是路由和存储的 key */
  id: string
  name: string
  /** section 内的相对路径，统一用 / 分隔 */
  path: string
  size?: number
  mtime?: number
  /** 笔记用：按标题切出来的小节数 */
  sectionCount?: number
  children?: VaultNode[]
}

export interface VaultSection {
  id: string
  name: string
  root: string
  publish: PublishLevel
  note?: string
  icon?: string
  /** 根目录不存在时不会让整个应用挂掉，只是这个 section 显示为不可用 */
  available: boolean
  counts: { notes: number; demos: number; folders: number }
  children: VaultNode[]
}

/** 断掉的图片引用。发布前你要能看到这份清单，而不是等线上发现图裂了。 */
export interface MissingAsset {
  section: string
  /** 引用它的笔记 */
  note: string
  /** 引用里写的原始路径 */
  ref: string
}

export interface VaultIndex {
  generatedAt: string
  scanMs: number
  sections: VaultSection[]
  stats: {
    notes: number
    demos: number
    /** 笔记正文总字节数 */
    noteBytes: number
    missingAssets: MissingAsset[]
    /** 扫描到的代码块语言，客户端照这份清单按需加载高亮语法 */
    languages: string[]
  }
  warnings: string[]
}

export interface Heading {
  /** 小节锚点 id */
  id: string
  text: string
  level: number
}

/** 一篇笔记按标题切出来的一个小节。切分级别是自适应的：先试 H1，没有 H1 就退到 H2。 */
export interface NoteSection {
  id: string
  /** 小节标题文本；整篇没有标题时为空 */
  title: string
  level: number
  /** 该小节的 markdown 原文（不含标题行本身） */
  markdown: string
  /** 该小节里的标题，用于在正文里生成锚点 */
  headings: Heading[]
}

/** 图片引用到可访问 URL 的映射。值为 null 表示这个引用是断的。 */
export type ImageRefMap = Record<string, string | null>

export interface NotePayload {
  id: string
  sectionId: string
  path: string
  title: string
  /** 整篇 markdown，供「复制全文」之类的用途 */
  markdown: string
  sections: NoteSection[]
  /**
   * 0 表示整篇不切分（既没有 H1 也没有 H2）。
   * 客户端靠它决定要不要显示折叠控件。
   */
  splitLevel: number
  imageRefs: ImageRefMap
  missing: string[]
  bytes: number
  mtime: number
  /** 同一 section 内按阅读顺序的上一篇/下一篇，在服务端算好，免得客户端自己排 */
  prev: { id: string; title: string; path: string } | null
  next: { id: string; title: string; path: string } | null
}

export interface DemoFileRef {
  name: string
  path: string
  ext: string
  /** 二进制或过大，只能看不能读 */
  readable: boolean
}

export interface DemoPayload {
  id: string
  sectionId: string
  path: string
  title: string
  /**
   * demo 自身的可访问 URL，给 iframe 用。
   *
   * **null 表示这个环境不提供运行 demo**（线上的情况）：demo 的运行素材——图片、字体、视频
   * ——没有上传到云端，iframe 跑起来会是缺图少字体的坏页面。客户端遇到 null 就只提供「看源码」，
   * 而不是给一个注定白屏的预览。判断依据由服务端给，客户端不猜。
   */
  url: string | null
  /** 同目录下的文件，给「看源码」当标签页 */
  files: DemoFileRef[]
  /**
   * demo 自己引用的外部域名。
   * 空数组表示自包含，打开就能跑；非空说明它要联网，而其中不少接口（比如黑马那套
   * 教学 API）早就失效了或者会被 CORS 挡掉。与其让人对着白屏猜，不如直接告诉他原因。
   */
  externalHosts: string[]
  /** HTML 太大没做分析 */
  analysisSkipped: boolean
}

export interface FilePayload {
  id: string
  sectionId: string
  path: string
  text: string
  truncated: boolean
  bytes: number
}

export interface SearchDoc {
  id: string
  sectionId: string
  path: string
  title: string
  /** 去掉了 markdown 语法的正文，用于建索引 */
  text: string
}

export interface SearchIndexPayload {
  generatedAt: string
  docs: SearchDoc[]
}

/* ------------------------------------------------------------ 发布（上云） */

/**
 * 发布配置。
 *
 * 这里只放不敏感的东西。R2 的凭证在 `.env.local`（已被 .gitignore 的 `*.local` 覆盖），
 * 只有 scripts/publish.ts 会读它——Vite 插件和浏览器都碰不到凭证。
 */
export interface DeployConfig {
  /** 文本发布快照目录（相对仓库根）。它会被提交进 git，构建时就是站点内容 */
  contentDir: string
  /** 允许上传到 R2 的扩展名。注意：**只有笔记正文引用到的文件才真的会上传** */
  assetExtensions: string[]
  /** 不上传的目录前缀（section 内相对路径），命中的整棵跳过 */
  assetExclude: string[]
  /** 同步进 content/ 时要跳过的文件名（构建产物，不是内容） */
  contentSkipFiles: string[]
  r2: {
    bucket: string
    /**
     * 对象键的前缀，也就是桶里的"文件夹"：
     * `MioNote/soft-exam/img/x.png` 而不是 `soft-exam/img/x.png`。
     *
     * 为什么要它：桶可能是和别人共用、或者你本来就拿它当通用文件桶用
     * （装 pdf、电路图、各种 yaml）。收进一个前缀里，MioNote 的东西
     * 就是一个自包含的文件夹，不和根目录上的别的文件混着。
     * 空字符串 = 直接放桶根。
     */
    prefix: string
    /** 公共访问域名。留空表示还没挂域名：上传能跑，但站点拼不出图片 URL */
    publicBase: string
  }
}
