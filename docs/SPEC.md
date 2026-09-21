# MioNote 设计说明

把你散在硬盘上的 7 个笔记文件夹，变成一个能读、能搜的本地阅读器。

这份文档记录的是**为什么这么做**。代码能告诉你怎么运行，但告诉不了你当初为什么否掉另一种做法——
过几个月你要加功能时，那些理由比代码更值钱。

---

## 一、定位：它是「读」的地方，不是「写」的地方

这一条决定了后面所有设计。

- 笔记还是你在 Typora / VSCode 里写，还是往 Gitee 提交。MioNote 不承担编辑职责。
- 因此**没有任何写回路径**：没有编辑器、没有保存按钮、没有冲突合并、没有版本回退。
- 最坏情况只是「显示得不对」，不可能是「笔记被改坏了」。

为什么这么定：这 1.8 GB 笔记没有备份策略，而一个只读系统在结构上就不可能破坏它。
以后想加编辑随时能加，但先证明读这一侧够用。

## 二、当前阶段：只跑在本地

首版不部署、不上传、不鉴权。`bun run dev` 起来，浏览器里看。

云端部署、移动端、Tauri 桌面壳都在后续阶段（见第六节）。当前这一版的价值是：
先把内容模型、渲染路径和交互定下来，并且**这些决定要能原样带到云端去**。

## 三、发布级别：fail-closed

`vault.config.ts` 里每个文件夹有一个 `publish` 字段：

| 值 | 含义 |
|---|---|
| `public` | 可以发布到云端，任何人可读 |
| `private` | 可以发布但需登录（鉴权尚未实现） |
| `never` | **永不发布**，只在本地读 |

当前映射：

| 文件夹 | 级别 |
|---|---|
| Web 前端、面试、软考、C#、日语 | `public` |
| Xray | `never` |
| 个人发展 | `never` |

**默认值是 `never`。** 新加一个文件夹时如果忘了写 `publish`，它不会被发布出去。

反过来做（默认公开 + 黑名单）的代价是：某天你新建一个文件夹，它会在没人察觉的情况下直接上云。
对于「隐私配置错了要付出真实代价」的系统，默认值必须是安全的那一侧。

Xray 和 个人发展 为什么是 `never` 而不是 `private`：

- `Xray/sg-vps1.pem` 是 SSH 私钥，`aws.yaml` / `aws-misub.yaml` 是带 uuid/server/port 的完整代理配置，
  而且 `从零搭建-Xray-Reality-Vision.md` 里有真实 IPv4、UUID 和 Reality 参数。
  这不是学习笔记，是操作文档。**即使加了登录，一次鉴权误配或一次 XSS（这个站点要渲染 markdown！）
  泄露的后果是「要换锁」，比笔记泄露严重得多。**
- `PersonalDev` 里有简历和私人材料。

所以正确的做法不是「给它们加个锁」，而是让云端**根本不产生副本**。

## 四、几个容易被改坏的设计决定

这几处都是试错之后定下来的，改动前请先看理由。

### 1. 文档标题一律取文件名，不取第一个 H1

你的 H1 有两种用法：既当文档标题，也当小节分隔符（面试一篇 16 个 H1，每个是一个问题）。

试过「取第一个 H1」：`01_Vue实例-指令.md` 的标题变成「Vue」，`Selfintro.md` 变成「实时时间」。
文件名是你给笔记起的名字，也是你在文件夹里认得出的标识——所以标题取文件名，
去掉 `02-` 这种编号前缀和扩展名。

### 2. 小节切分级别是自适应的

一篇里：有 H1 就按 H1 切，没有 H1 就退到 H2，连 H2 都没有就整篇呈现。

数据分布（扫描时的实测）：面试 112 个 H1 / 10 篇、软考 180 个 H1 / 20 篇，但 C# 有 16 篇一个标题都没有、
日语有 3 篇没有 H1。**不能因为缺少标题就丢掉内容**，也不能假设所有笔记都是同一种形态。

### 3. 搜索是子串扫描，不是倒排索引

最初打算用 MiniSearch + 中文二字词切分。量化之后否掉了：

- 全库 82 篇笔记、正文 386 KB、纯文本索引 208 KB
- 「82 次 `indexOf` 扫 400 KB」是亚毫秒级的，比维护倒排索引更快
- 更重要的是**不用赌分词**：搜「慢查询」「B+树」「五十音」都是精确子串，
  中文单字搜索也直接能用——这是二字词切分做不到的

笔记量涨到十倍（4 MB）这个方案依然够用。真到几十 MB 再换 Pagefind 也不迟，
那时候服务端预建索引才有意义。

### 4. 图片路径映射返回三种结果，不是两种

`AssetResolution = 'external' | 'missing' | { url }`。

`external` 和 `missing` 必须分开。混成同一个 `null` 的后果是：笔记里引用的
`https://www.baidu.com/img/bd_logo1.png` 会被报成「断链」，断链报告就失去了可信度。

### 5. 图片不做转码

本地直接用原图。转 WebP 是上云阶段的事——软考的 UML 图和代码截图做有损重编码会掉可读性，
本地没有带宽问题，没必要付这个代价。

### 6. hash 路由，不是 history 路由

这份代码将来要丢进 Tauri 的 webview 和 Cloudflare 的静态托管里直接跑。
hash 路由不需要任何服务端 rewrite 规则配合，换环境零配置。

### 7. demo 的 iframe 用 `allow-same-origin`

必需的：不带上它 iframe 会变成不透明源，那些用 XHR 取数据的 demo 会被跨域策略直接拒掉。
代价是 demo 和主站同源，理论上能碰到 localStorage。

**当前是可接受的**（demo 都是你自己的课程练习代码，而且只在本机跑）。
上云阶段要重新考虑：那时候应该把 demo 放到独立域名下。

### 8. 图标：两套并用，跟 VS Code 自己的做法一致

一开始我用 Google 的 Material Symbols 做全部图标，这是个错误的理解——
要的是 VS Code 里那套**文件图标主题** Material Icon Theme。两者是完全不同的东西：
Material Symbols 是单色的界面图标集，Material Icon Theme 是**彩色**的文件/文件夹图标主题。

而 Material Icon Theme **没有**搜索、关闭、刷新这类界面图标（它的定位就是文件图标）。
VS Code 自己的界面图标来自另一个官方图标集 **Codicons**。所以正确的组合是：

| 用途 | 图标集 | 组件 | 特点 |
|---|---|---|---|
| 文件、文件夹 | material-icon-theme（MIT） | `src/components/FileIcon.tsx` | 彩色，`.md` 蓝、`.html` 橙、`.vue` 绿 |
| 界面（搜索/关闭/主题…） | @vscode/codicons（CC-BY-4.0） | `src/components/Icon.tsx` | 单色，继承 `currentColor` |

界面图标单色的额外好处：明暗主题都不用管，CSS 一改色就跟着变。

**生成方式**：`scripts/generate-icons.mjs` 读取两个包的 manifest，产出
`src/generated/icons.ts`（约 260 KB，gzip 45 KB）。不把 1251 个图标全带进来是因为
完整 manifest 有 450 KB——所以脚本按允许清单筛（约 200 个图标），
覆盖 `vault.config.ts` 声明过的全部扩展名 + 常用的一批。

脚本负责三件容易出错的事，改它的时候要留意：

1. **白名单过滤元素和属性**。生成的 SVG 片段在构造上就是安全的，
   所以渲染时可以直接注入，不需要运行时再做一遍过滤。
2. **给 id 加图标前缀**。117 个图标自带 `id`，全部内联进同一份文档会互相覆盖——
   `folder-css` 就是靠 `<defs>` + `<use href="#a">` 画的，前缀是 `material-folder-css--a`。
3. **只认 path 会画残**。有 20 个图标用了 `circle`/`ellipse`/`g`/`linearGradient`，
   只抽 `<path>` 会把它们的彩色装饰丢掉（`folder-css`、`folder-vue`、`folder-python` 都在此列）。

**文件夹名匹配是四层回退**，因为你的目录名很杂（395 个唯一名字里只有 39 个是 manifest 直接认识的）：

| 层 | 例子 | 结果 |
|---|---|---|
| 1. 精确 | `img` | `folder-images` |
| 2. 中文别名 | `笔记` | `folder-docs` |
| 3. 去掉编号前缀 | `02_CSS` / `09_Node.js` | `folder-css` / `folder-node` |
| 4. 英文词块 | `01-CSS的编写位置` | `folder-css` |
| 5. 都没有 | `01-路由模块拆分` | Material 的默认灰文件夹 |

第 4 层只做「整词相等」和「词首匹配」，**不做子串包含**。子串包含踩过两个坑：
`axios` 里含 `ios`（→ 被当成 iOS 文件夹）、`routerlink` 里含 `out`（→ 被当成输出目录）。
按英文词块判断就不会有这个问题。实测 395 个目录名里 141 个能解析出具体图标。

**侧栏那 7 个文件夹的图标是手写的**（`vault.config.ts` 里的 `icon` 字段），因为自动解析
处理不了「面试」「软考」这种纯中文名，而且一个文件夹配什么图标本来就是个审美决定。
选的时候**要看着字形选**——这些图标不少带技术字母（`folder-kotlin` 带 K、`folder-python` 是蛇、
`folder-java` 是咖啡杯），只看名字挑会给 C# 配一个带 "K" 的图标。
`folder-i18n`（紫底「文A」翻译字形）给日语、`folder-keys`（钥匙）给 Xray 是两处语义贴合的巧合。

重新生成图标：`bun run icons`。

### 9. 展开/收起用 grid-template-rows 0fr→1fr，不测高度

```css
.branch { display: grid; grid-template-rows: 0fr; transition: grid-template-rows var(--expand-dur) var(--expand-ease); }
.branch[data-open] { grid-template-rows: 1fr; }
.branch__inner { overflow: hidden; min-height: 0; }
```

这是现在唯一能纯 CSS 动画到「内容自然高度」的做法。对比另外两条路：

- `max-height`：要猜一个上限。猜小了内容被截断，猜大了动画节奏会飘（前 30% 就快播完了）。
- JS 测量高度：内容里的图片加载完会把高度撑大，测出来的值立刻过时。

`min-height: 0` 那行是必须的，不加的话 grid 子项会被内容的最小高度撑开，`0fr` 收不回去。

**三处展开交互共用这一个 `.branch`**（文件树、笔记小节、侧栏分组），所以手感一致。

收起时要先让高度动画播完再隐藏内容，否则内容会瞬间消失、只剩容器在缩：

```css
.branch__inner { visibility: hidden; transition: visibility 0s linear var(--expand-dur); }
.branch[data-open] > .branch__inner { visibility: visible; transition-delay: 0s; }
```

`visibility: hidden` 还兼了两个职责：收起的子树不能被 Tab 聚焦、也不会被读屏软件读到。

### 10. 子树懒挂载，展开后不卸载

```tsx
const [mounted, setMounted] = useState(open)
if (open && !mounted) setMounted(true)
```

两个约束互相拉扯，这是同时满足它们的做法：

- **一收起就卸载** → 容器瞬间变空，收起动画没有内容可动（只剩高度在缩，内容是闪没的）
- **一开始就全挂载** → Web 前端那棵树有 659 个 demo 叶子，全渲染没意义

所以：首次展开才挂载，之后一直留着。渲染期派生 state（不是在 effect 里）是为了避免
先渲染一帧空内容再补挂载的闪烁。

### 11. 展开状态驱动样式，不额外传 prop

chevron 旋转和文件夹图标的交叉淡切，都靠按钮上的 `aria-expanded` 驱动：

```css
[aria-expanded='true'] .chev { transform: rotate(90deg); }
[aria-expanded='true'] .tree__folder-open { opacity: 1; transform: scale(1); }
```

好处是没有「视觉状态」和「语义状态」两份真相——本来就要写 `aria-expanded`（无障碍需要），
样式直接读它，不可能不同步。

用后代选择器而不是子选择器是有意的：嵌套的文件夹按钮不是外层按钮的后代，所以不会误伤。

### 12. 尊重系统的「减少动态效果」

`prefers-reduced-motion: reduce` 下把 `--expand-dur` 压到 0.01ms，
展开收起变成瞬时的，滚动也关掉平滑。不用为它维护第二套代码路径。

### 13. 一个测量上的坑（不是应用问题）

React 19 对离散事件（click）的 state 更新是**异步刷新**的，所以「点完立刻同步读 DOM」
永远读到的是旧状态。想验证展开动画必须延迟读取。

另外，自动化驱动的标签页里渲染时间线会被冻结，CSS 过渡可能停在起始值不动。
判断方法：强制抓一帧（截图）会推它一把；把 `--expand-dur` 设为 0 后高度立刻正确，
就说明 CSS/布局没问题，只是时间线被节流了。

### 14. 断链和「跑不起来的 demo」都要主动说出来

- 断链：渲染成占位块而不是崩掉，侧栏底部有完整清单（当前 1 条）
- demo：分析它的 HTML，列出它引用的外部域名。
  659 个 demo 里有 57 个引用 CDN，一批依赖黑马的教学 API（`hmajax.itheima.net`）和
  第三方站点（`prod.jd.com`、`cba.itlike.com`、`search.jd.com`）——这些接口大部分已经失效或会被 CORS 挡掉

空白页面是最糟的失败方式。直接告诉用户「白屏是因为它要联网，不是你的代码写错了」，
比让他对着白屏猜有价值得多。

## 五、内容契约（将来搬到别的平台靠这个）

```
ContentSource 接口
├── getIndex(refresh?)   → VaultIndex     目录树 + 统计 + 警告
├── getNote(section,path)→ NotePayload    小节 / 标题 / 图片映射 / 断链 / 上一篇下一篇
├── getDemo(section,path)→ DemoPayload    iframe URL + 同目录文件 + 外部域名
├── getFile(section,path)→ FilePayload    只读文本（有白名单）
└── getSearchIndex()     → SearchIndexPayload
```

当前只有一个实现：`src/api/contentSource.ts` 里的 HTTP 版，由 Vite 插件提供。

将来两个实现（形状完全一致，React 代码一行都不用改）：

- **Tauri 桌面端** —— 走 IPC 直接读磁盘，能读还没索引的新文件
- **云端静态站** —— 读构建时生成的静态 JSON

服务端侧的关键实现：

| 文件 | 职责 |
|---|---|
| `plugins/vault/scan.ts` | 遍历文件夹、分类文件、建内容树、剪掉只有图片的目录 |
| `plugins/vault/markdown.ts` | 解析 frontmatter / 标题 / 代码块 / 图片引用，自适应切分小节 |
| `plugins/vault/store.ts` | 缓存、笔记与 demo 的 payload、搜索索引、资源路径边界检查 |
| `plugins/vault/index.ts` | HTTP 接口、`/@vault/` 静态流式服务、文件监听 |

安全边界在 `store.ts` 的 `resolveAssetPath` 和 `getFile`：
前者做路径穿越检查（确保没跑出笔记根目录），后者是白名单（只允许读扫描时收进来的文件）。

## 六、后续阶段

### 阶段二：上云（你说了之后再做）

已确认的目标形态：**纯公开静态站**（除 Xray/个人发展 外的 5 个文件夹），
Workers Assets 放站点壳、R2 放图（732 MB / 2975 张，R2 出网免费）。

还没定的：

- **发布路径**。你的 Gitee 仓库里 3 个是私有的，CI 要它们得配 Gitee token；
  而 732 MB 图片不适合进任何 git 仓库。所以我倾向「本地一条命令发布」而不是 GitHub Actions，
  但这条要等你真的要上云时再定。
- **图片是否转 WebP**。能砍到约 1/3 体积，代价是软考那些图有损重编码。
- **鉴权**：因为 Xray/个人发展 不走云，当前设计里**不需要任何鉴权**。
  哪天你想让某个 `private` 文件夹上云，才需要引入 CF Access。

### 阶段三：移动端

建议是 **PWA**，不是 Tauri 安卓。

理由很实际：云端既然是纯公开静态站，PWA 几乎免费（同一个网页加个 manifest 和 Service Worker
就能装到桌面、离线看已缓存的笔记）。而 Tauri 安卓需要 Android SDK + NDK + Rust 交叉编译，
你这台机器上现在一个都没有。

除非你要「手机本地也存一份完整笔记」这个能力，否则 PWA 是明显更划算的路。

### Tauri 桌面壳

等本地阅读器用顺了再套。那时才需要装 Rust 工具链。

套壳之后可以把「扫盘」换成运行时通过 IPC 读文件（能读到刚新建、还没进索引的文件），
以及把「发布」做成一个按钮。

## 七、已知限制

- **`13_Eletron/13_Electron/` 是重复目录**（拼错了的那份里面还嵌了一整份）。
  内容树里两个都会出现。建议在源文件夹里合并掉——这是动你的文件，我没代劳。
- **Vue 的 demo 跑不起来**：`.vue` 需要打包器，只能当源码看。
- **引用根路径的 demo 会挂**：demo 的 HTML 里如果写 `/js/app.js`（而不是相对路径），
  在 `/@vault/` 下解析不到。当前没发现这类，但换文件夹后可能出现。
- **文件监听依赖 `fs.watch` 的递归支持**。某些环境下会失灵，所以侧栏底部留了「重新扫描」按钮——
  这个应用的失败模式必须是「数据旧了」，不能是「数据错了」。
- **每篇笔记独立渲染**：正文被按标题切成若干块分别渲染，所以跨小节的 markdown 结构
  （比如跨标题的列表、脚注）会断。当前笔记里没有这种用法。
- **首屏 JS 偏大**：实测 `index` chunk 603 KB（gzip 188 KB），主要是 react-markdown + remark-gfm + shiki 核心。
  本地跑无所谓，但上云/PWA 阶段这是要处理的——那时的正确做法是构建时预渲染成静态 HTML，
  客户端只做水合，而不是继续优化这个 bundle。
- **窄屏布局没有在真实窄视口下验证过**：响应式 CSS 写了（侧栏变抽屉、目录移到正文上方），
  但验证时用的浏览器通道改视口尺寸会报错，所以只验证了桌面宽度。

## 八、这次盘点发现的

- 5 个公开文件夹：**82 篇笔记 / 386 KB 正文 / 659 个 demo / 2975 张图 732 MB**
- 断链图片：**1 条**（`soft-exam/06-软件工程.md` → `./img/Snipaste_2025-10-19_15-06-31.png`）
- 22 个 `README.md` 是脚手架模板说明，不是笔记，已在 `ignoreFiles` 里排除
- 代码块语言：bash / json / text / js / html / markdown / csharp / ts / java / yaml / python / sql /
  css / vue …客户端只按这份清单加载 shiki 语法，不把几百种语法全拖进浏览器
