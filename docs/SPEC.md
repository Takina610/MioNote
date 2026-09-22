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

- 断链：在正文里渲染成占位块而不是崩掉；**汇总清单在构建产物里**——
  `bun run build` 会列出所有源文件本来就不存在的引用，dev server 启动日志也会提示总条数。
  界面上没有这份清单（用户要求删掉所有统计类文字，见第 17 节），但信息没丢。
- demo：分析它的 HTML，列出它引用的外部域名。
  659 个 demo 里有 57 个引用 CDN，一批依赖黑马的教学 API（`hmajax.itheima.net`）和
  第三方站点（`prod.jd.com`、`cba.itlike.com`、`search.jd.com`）——这些接口大部分已经失效或会被 CORS 挡掉

空白页面是最糟的失败方式。直接告诉用户「白屏是因为它要联网，不是你的代码写错了」，
比让他对着白屏猜有价值得多。

### 15. 选中态的样式必须连 `:hover` 一起写

`tree__row--active` 只写了 background，结果鼠标一移到选中的条目上，蓝色就被
`.tree__row:hover` 的灰底盖掉——因为 `:hover` 那条的选择器特异性更高 (0,2,0) > (0,1,0)。
写字面更"强"的 `!important` 是绕路，正确做法是把两条写在同一个规则里：

```css
.tree__row--active,
.tree__row--active:hover { background: var(--accent); color: #fff; }
```

同样的坑在文件标签页（`.file-tab--active`）上也存在，一并修了。**加任何 `--active` 类时
都要顺手写一遍 `:hover` 分支**，否则就是"选中会闪一下"这类说不清的小毛病。

**同族的第二个问题：高亮要落在最小的那个元素上。** 分区高亮原本写在 `.section--active` 上，
而 `.section` 是整块（标题行 + 展开后的整棵子树）。于是当前笔记所在的分区整片变成淡蓝，
文件行的 `:hover` 又画一块灰底——灰块嵌在蓝底里，看起来像缺了一角（用户原话：
"这明显感觉会缺一块"）。修法是把背景收回到标题行：

```css
.section--active > .section__head { background: var(--accent-soft); }
```

判据：**一个高亮该染多大范围，取决于它想说明什么**。「我在哪个笔记本里」是标题行的属性，
就只染标题行；染整块会同时和内部的 hover、选中态打架（三种底色叠在一起）。
凡是把背景加在容器上、而容器里还有可交互子元素的地方，都要先想一遍这件事。

### 16. 侧栏可收起、可拖宽；滚动条分两种待遇

跟 VS Code 对齐的两件事：

- **收起**：桌面端把栅格第一列收到 0（`.app--collapsed`），窄屏则是抽屉。
  两者必须分开——窄屏的抽屉用 `sidebarOpen`，桌面用 `collapsed`，而且判断当前是不是窄屏
  要用 `matchMedia('(max-width: 900px)')`。踩过的坑：桌面点开关时顺手把抽屉标记也置上，
  那次点击就"吃掉"了下一次 Ctrl+B（下一次只是把抽屉标记清掉，看起来像快捷键失灵）。
- **拖宽**：右边缘 6px 的手柄，`pointermove`/`pointerup` 挂在 **window** 上而不是手柄上。
  手柄只有 6px，鼠标一往右拖就离开它了；只挂在元素上就必须依赖 `setPointerCapture`
  把事件追回来（capture 失败时整个拖拽就哑了）。宽度存 localStorage，双击手柄恢复默认。

**滚动条：侧栏隐藏，内容区自定义。** 侧栏常驻在屏幕边上，一根常亮的滚动条比内容还抢眼
（`scrollbar-width: none`，滚动照旧可用）。正文、目录、搜索面板、代码块换一套自定义滚动条
（透明轨道 + 圆角细滑块 + 悬浮加深），明暗各一套变量。系统的默认滚动条在 Windows 上是
灰底白槽的方角，放在这个界面里像从别的程序剪下来的。

### 17. 界面上一律不放统计与说明文字（2026-09-22 用户要求）

用户看过成品后要求把界面上的统计/说明文字**全部**删掉。删掉的是：

| 位置 | 原来显示 |
|---|---|
| 侧栏底部 | `笔记 82 · demo 659`、`1 张图找不到` + 可展开的断链清单、扫描警告 |
| 侧栏标题下 | `82 篇笔记 · 386 KB` |
| 侧栏树里 | 文件夹右边的小节/文件数（`02_CSS 117`、`18 · 659 demo`） |
| 笔记页顶部 | `24 个小节 · 13 KB · 改于 2025-10-21 · ⚠ 1 张图没找到` |
| 主页 | 四个统计数字、每张卡片的备注与磁盘路径、底部「永不发布」说明段 |
| 搜索面板底部 | `已索引 79 篇` |

**留下的**：导航（目录、上/下篇、最近打开、搜索）、文件夹名、以及
`公开 / 不发布` 标记——最后这个是隐私信号，不是统计，删了会让人看不出哪些文件夹永不外传。

**这条要当规矩记着**：以后想加「N 篇笔记」「已索引 N 条」这类文字时，先想想是不是又要被要求删掉。
需要这些数字的场景是构建/发布（CLI 会打印），不是阅读界面。第 14 节那份断链报告就是这么处理的。

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

> **第一批已经落地**（2026-09-22）：文本快照 + 图片上传这条内容管道，见第九节。
> 剩下的是静态构建与部署。

已确认的目标形态：**纯公开静态站**（除 Xray/个人发展 外的 5 个文件夹），
Workers Assets 放站点壳、R2 放图（R2 出网免费）。

还没定的：

- **发布路径**。你的 Gitee 仓库里 3 个是私有的，CI 要它们得配 Gitee token；
  而 732 MB 图片不适合进任何 git 仓库。所以我倾向「本地一条命令发布」而不是 GitHub Actions，
  但这条要等你真的要上云时再定。**（2026-09-22 更新：图片这条已经不是问题了——只传 387 MB
  且走 R2；文本 13 MB 可以进仓库，所以 CI 这条路重新变得可行。仍然没定。）**
- **图片是否转 WebP**。能砍到约 1/3 体积，代价是软考那些图有损重编码。**（2026-09-22 定：
  第一版不转码。R2 存储与出网免费，转码唯一收益是手机加载速度；等真觉得慢再加 `--webp` 开关。）**
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
- **文件监听依赖 `fs.watch` 的递归支持**。某些环境下会失灵；失灵时重启 dev server 即可
  （界面上不再有「重新扫描」按钮：常驻一个按钮的代价大于它偶尔的用处）。
- **每篇笔记独立渲染**：正文被按标题切成若干块分别渲染，所以跨小节的 markdown 结构
  （比如跨标题的列表、脚注）会断。当前笔记里没有这种用法。
- **首屏 JS 偏大**：实测 `index` chunk 839 KB（gzip 237 KB，2026-09-22 量的；初版记的 603 KB 已过期），
  主要是 react-markdown + remark-gfm + shiki 核心 + 内联的图标表。
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

## 九、上云第一批：文本进仓库，图片进 R2

2026-09-22 定。它和第二节（本地优先）、第三节（fail-closed）是连着的：
**线上只读、只有你本机能传、敏感文件夹连副本都不产生。**

### 怎么分家

| 东西 | 去哪 | 为什么 |
|---|---|---|
| md / html / js / css / vue：13.2 MB / 1605 个 | `content/` 快照，**提交进 git**，构建时打进站点 | 你要能 grep、能 diff 自己的笔记；而这条链必须能在**没有 D: 盘的机器上**构建（CI、换电脑） |
| 笔记正文引用到的图片：387 MB / 1078 张 | **R2** | 732 MB 图片进不了任何 git 仓库；R2 存储与出网都免费，849 MB 也在免费额度内 |
| demo 引用的图 196 MB、无人引用的孤儿 178 MB | 哪里都不去 | 线上不跑 demo（见下），demo 的图没有任何页面会请求 |
| 字体 17.9 MB（含 12 个 iconfont）、音视频 70 MB | 哪里都不去 | 你选了「严格只传图片」，代价见下 |
| 非图片杂项：13 个 yarn.lock、`.7z`、`.download`、`.sln`/`.csproj` | 哪里都不去 | 「文本 / 非文本」这个边界太粗——那会把构建产物也传上 CDN，所以边界是**两个显式白名单** |

### 上传集合是算出来的，不是挑出来的

`collectNoteAssets()`（`plugins/vault/deploy.ts`）遍历每篇笔记、取 `NotePayload.imageRefs` 里
解析成功的那一项——**和渲染用的是同一份数据**。因此：

- **不会漏传**：只要一篇笔记渲染得出来，它引用的图就一定在清单里
- **不会多传**：没人看的图一张都不上传

这也是为什么不需要人工分类那 2975 张图（我一开始以为这是本次最花时间的活）。真要人工介入的
只有 `deploy.assetExclude`——一个目录前缀黑名单，默认空。

考虑过但否掉的两条路：按引用分析排掉孤儿（JS 里拼出来的路径天生测不出来，线上会静默缺图），
以及「非文本全上」（会带上 yarn.lock 和 VS 工程文件）。

### 线上不跑 demo，只看源码

demo 的 HTML 里写的是相对路径（`./images/x.jpg`），如果 HTML 从站点出、图片从 R2 出，
这些路径必然 404。两条修法——构建时改写路径（JS 里拼的路径改不了），
或者同源 + Worker 把 `/vault/**` 转发到 R2——在决定「严格只传图片」之后**都不需要了**：
字体和音视频不上传，demo 就算跑起来也是坏的（iconfont 图标变豆腐块、字体回退、视频空播放器），
所以线上只提供「看源码」反而是诚实的选择。

**这是一处有意的取舍，不是遗漏。** 线上你看到的是笔记（完整）和 demo 源码（可读），
想看 demo 真跑起来就回本地。哪天想让线上也能跑，要同时做三件事：把字体和音视频加进
`assetExtensions`、让 demo 走同源或改写路径、把 iframe 打开。

### 键名与 URL

R2 的对象键是 `<前缀>/<section>/<笔记内相对路径>`，本地是 `/@vault/<section>/<rel>`——
两边只差前缀这一段，出问题时对着看就知道是哪张图。中文文件名保留不重命名
（磁盘上叫什么，桶里就叫什么），URL 按段百分号编码。

**前缀（`deploy.r2.prefix`）是为什么存在的**：桶常常不只服务一个项目。这个桶里原本就有
`pdf_files/`、`印制电路工/`、一堆根目录文件，如果 MioNote 的五个 section 直接铺在桶根，
一眼看不出哪些是它的，想单独锁域名或清理时也容易误伤。收进一个 `MioNote/` 之后：

```
file-bucket/
  MioNote/                    ← 1087 个对象，全是 MioNote 的
    web-frontend/ interview/ soft-exam/ csharp/ japanese/
  pdf_files/  印制电路工/  aws.yaml  …   ← 别人的东西，原样不动
```

配套的安全性质（都验证过）：
- 上传只写自己的前缀
- `--prune` **从账本出发**，不列桶，所以只会删自己上传过的对象
- 上传有任何一个失败时，**不执行任何删除**（删除是这条流水线里唯一不可逆的动作，
  失败的图通常意味着网络或权限有问题，那时候顺手删旧对象的风险完全不成比例）
- `preflight.ts` 会列出桶里不属于 MioNote 的对象，让你在传之前看一眼

实际部署（2026-09-22 首次上传，1078 张 / 387.1 MB / 66 秒；随后迁进前缀，重传 201 秒含删除）：

```
桶        file-bucket
桶内路径  file-bucket/MioNote/
公共域名  https://cdn.tak1na.cn
样例      https://cdn.tak1na.cn/MioNote/soft-exam/img2/Snipaste_2025-10-21_22-23-23.png?v=1d065ffd
```

公开 URL 形如 `<R2_PUBLIC_BASE>/<key>?v=<sha256 前 8 位>`。带 `?v=` 才敢用
`Cache-Control: public, max-age=31536000, immutable`——图换了，URL 跟着换，不会粘旧缓存。

**`?v=` 来自图片内容本身的哈希，不是上传时间。** 所以同一个文件重传多少次，URL 都不变；
内容变了，URL 立刻变。这一点是后面所有缓存判断的基础。

**换前缀等于换一套 key**：账本里记着上次用的前缀，改了之后所有对象都会被当成"没传过"
重新上传，旧的那些会被认成"已不在上传集合"，加 `--prune` 才真删。

#### 这个桶里另外那几个文件是公开可读的

配 R2 的过程中撞见的：`https://cdn.tak1na.cn/aws.yaml`（以及 `aws-misub.yaml`、`flclash.yaml`）
实测返回 200，内容含真实的 `uuid` / `reality` / `vless` 参数——也就是第三节里那两个
`never` 文件夹要保护的东西，只是这次不是 MioNote 漏出去的（它们本来就在桶里，
是用户拿这个桶当通用文件桶用的）。

MioNote 的做法是对的（收进自己的前缀、只读、上传能力只在本机），但这说明
**「敏感文件不能和公开内容放在同一个存储/域名下」不是理论担忧**——它已经发生过一次。
删文件不等于没泄露过，那套配置该换。

### 上传账本是提交进仓库的

`assets.manifest.json`（仓库根，**要提交**）记录 `key → { sha, size, mtime, at }`。
`at > 0` 表示 R2 上真的有这张图。

为什么不像最初设计的那样放 `.cache/` 里（gitignore 掉）：**静态构建必须能在没有 D: 盘的机器上跑**
（CI、换台电脑），而它需要知道"哪些图存在、哈希是多少"。图片本身不在仓库里，所以这份账本就是
唯一的真相来源。三个消费者：

| 谁 | 用它做什么 |
|---|---|
| `bun run publish` | 逐张比对哈希，只传变化的；上传成功后写 `at` |
| `bun run build` | 在账本里的图 → 拼 R2 URL；不在的 → 渲染成断链占位 |

由此推出两个性质：

- **构建不需要网络，也不需要 D: 盘。** 它只读 `content/`（文本）+ 账本（图片清单）。
- **一份产物可以复现。** 换台机器只要拿到仓库，构建出来的 HTML 和图片 URL 完全一致。

### `bun run build` 也是发布前的最后一道关

它会把正文引用到的图分成三类，并且**只有中间那一类会让构建失败**：

| 类别 | 含义 | 处理 |
|---|---|---|
| 上传了 | 账本里有、`at > 0` | 拼 R2 URL |
| 待上传 | 该有但还没有（没登记，或登记了没传） | **构建失败**，列出清单，提示跑 `bun run publish` |
| 已知断链 | 源文件本来就不存在 | 渲染成占位，只提示不失败 |

第三类必须和第二类分开，否则那条永远修不好的断链会让构建**永远过不去**——
传完所有图也还是失败，人就会开始用 `--allow-missing-assets` 绕过这一关，然后这道关就废了。
可构建时**没有磁盘访问**，分不出"没上传"和"链接是坏的"，所以由 `publish`（它有磁盘访问）
用 `onMissingAsset` 把断链记进账本。

一次性绕过：`bun run build --allow-missing-assets`（首次试构建用）。

### 静态站的样子

```
dist/
  index.html + assets/**       SPA 壳（vite build 产出）
  api/vault.json               索引：树 + 统计 + 断链报告
  api/search-index.json        全文搜索用的正文
  api/note/<section>/<rel>.json   每篇笔记（小节、图片映射、上一篇下一篇）
  api/demo/<section>/<rel>.json   每个 demo（url 为 null、同目录文件清单）
  @vault/<section>/<rel>       文本原样拷贝，给「看源码」用
```

`@vault/` 这个前缀**和 dev 完全一样**是有意的：客户端只把 payload 里给的字符串塞进 `<img src>`，
不需要知道自己在哪个环境；「看源码」在两边取的都是同一个路径。

产物里不该出现本机绝对路径（索引的 `root` 会被换成 `content/<id>`）。
构建结束会扫一遍产物做自检——但用的是**精确匹配我们自己知道的路径**，不是"看起来像 Windows 路径"
的正则：后者会误报（笔记正文里到处是 `https://cdn.jsdelivr.net/...`，其中 `s://` 撞上盘符模式；
还有用户自己写的 `e:/path（上传）`）。自检要是会误报，人就会开始忽略它，那还不如没有。

### 线上不跑 demo，只看源码（客户端怎么知道）

`DemoPayload.url` 是可空的：**null 表示这个环境不提供运行 demo**。
静态构建把 `demoRunnable: false` 传给 store，于是 url 是 null，客户端就只渲染「看源码」页签、
并说明原因。判断由服务端给，客户端不猜——比在前端读一个环境变量可靠。

### 凭证与安全边界

- 凭证（`R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`）只在 `.env.local`，
  被 `.gitignore` 的 `*.local` 覆盖；**只有 `scripts/publish.ts` 读它**。
- 上传能力只存在于这条命令里，浏览器里没有任何入口（dev 面板曾经存在，按用户要求删掉了）。
  状态查询用 `bun run publish:dry` / `bun run scripts/verify-upload.ts`。
- 上传时带 `X-Amz-Content-Sha256`（真实文件哈希，而不是 aws4fetch 默认的 `UNSIGNED-PAYLOAD`）：
  R2 因此会校验载荷，账本里记的 sha 就等于 R2 上真正存的东西。
- 静态构建的 fail-closed 检查：只有 `publish: 'public'` 会进产物（`never` 和 `private` 都排除，
  `private` 会被明确报出来），`content/` 里出现不该发布的文件夹会被点名，
  产物里的 `root` 一律换成 `content/<id>`，最后再扫一遍产物确认没有本机路径漏出去。

### 漂移是可见的，不是被消除的

D: 盘是写作源，`content/` 是发布快照，两者**会**漂移。消除它要牺牲「写完立刻能读」的手感
（dev 读 D:，所以你改完笔记马上就能在阅读器里看到），所以选择让漂移可见：

- `bun run publish` 每次都检查 `content/` 是否落后，落后就打印警告（不阻塞——加一张截图
  不该被"你还有一篇笔记没同步"挡住），并列出具体是哪些文件
- 同步状态用 `bun run sync --dry-run` 看；不再有常驻界面指示器（用户要求把 dev 面板撤掉）
- 快照的"已同步"判断是**精确相等**（大小 + mtime 都相同），不是"快照比源文件旧"。
  拷贝时会把源的 mtime 一起写过去（`fs.utimesSync`），所以两边能对得上；
  用 `<` 判断会漏掉一种情况：你把笔记回退到旧版本时 mtime 往回调、大小又恰好一样，
  面板就会撒谎说"已同步"——而这个指示器撒谎，整套"让漂移可见"的设计就白做了。

### 命令

```bash
# 发布（三条，按顺序）
bun run sync            # D: 上的文本 → content/（会删掉源文件夹里已经没有的文件）
bun run publish         # 图片 → R2（增量；没变的不会重传）
bun run build           # 生成静态站，并核对上面两件都做完了

# 辅助
bun run sync --dry-run          只看差多少
bun run publish:dry             看要传什么，不发任何请求
bun run publish --registry      只登记账本不上传（想在真上传前先看站长什么样时用）
bun run publish --only soft-exam
bun run publish --prune         顺手删掉 R2 上已不在上传集合里的对象
bun run build --allow-missing-assets   有没上传的图也继续
bun run preview                 本地起静态站（默认 4173）
bun run scripts/verify-site.ts  对 preview 起的产物跑一遍自检
```

`bun run preview` 只绑 IPv6 回环，所以要用 `http://localhost:4173` 访问；
用 `127.0.0.1` 会连不上（不是应用的问题）。

**还没上传时也能在本机看到带图的静态站**：dev server 的 `/@vault/<section>/<rel>` 和 R2 上的
key 结构完全一样，所以把 `R2_PUBLIC_BASE` 指向它再构建一遍即可：

```bash
R2_PUBLIC_BASE=http://localhost:5178/@vault bun run build --allow-missing-assets
```

实测 163 张图全部加载成功。这份 `dist/` 只能本地看（图片地址是 localhost），部署前必须用真域名重建。
这个技巧也顺带证明了 URL 替换逻辑本身是对的——**换了前缀之后图确实取得到**，
不用等云端环境才能验证。

### 阶段二剩下的事

内容管道**和静态站都通了**（本地 `bun run build && bun run preview` 就能看到线上形态）。
剩下的只有部署本身：

- **把 `dist/` 传到托管上**：Cloudflare Workers Assets 或 Pages。hash 路由，不需要任何 rewrite 规则
- **R2 挂自定义域名**（或先用 r2.dev 的地址试水——Cloudflare 明确说那个地址有限流，不适合长期）
- 域名定了之后，`R2_PUBLIC_BASE` 写进 `.env.local`，`bun run publish` 会因为域名变化自动重传一遍
  （账本里记着上次用的域名）
