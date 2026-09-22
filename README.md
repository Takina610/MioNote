# MioNote

把你散在硬盘上的笔记文件夹，变成一个能读、能搜的本地阅读器。

笔记还是你在 Typora / VSCode 里写、还是往 Gitee 提交——这里只负责读。
**没有任何写回路径**：最坏情况只是显示得不对，不可能是笔记被改坏。

## 跑起来

```bash
bun install
bun run dev          # http://localhost:5178
```

> **这一版只在 dev 模式跑。**
> `bun run build` 能过（用来验证客户端能编译成生产产物），但产出的 `dist/` 里没有接口层——
> Vite 插件是 `apply: 'serve'`，`bun run preview` 打不开应用。
> 静态产物是上云阶段的事（见 `docs/SPEC.md` 第六节）。

首次启动会打印一份扫描报告：

```
  MioNote · 已索引 7 个笔记文件夹（165 ms）
  笔记 82 篇 · demo 659 个 · 正文 386 KB

       Web 前端   笔记  18 · demo 659   公开
       面试       笔记  10 · demo   0   公开
       软考       笔记  20 · demo   0   公开
       C#         笔记  22 · demo   0   公开
       日语       笔记   9 · demo   0   公开
    禁 Xray       笔记   2 · demo   0   不发布
    禁 个人发展   笔记   1 · demo   0   不发布
```

## 用法

| 操作 | 快捷键 / 位置 |
|---|---|
| 全文搜索 | `Ctrl + K`（中文子串直接搜，多个词用空格隔开） |
| 折叠 / 展开小节 | 点小节标题；或笔记顶部的「全部折叠 / 全部展开」 |
| 主题 | 侧栏左上角的图标，在 浅色 → 深色 → 跟随系统 之间循环 |
| 收起 / 展开侧栏 | 侧栏左上角的箭头，或 `Ctrl + B`；收起后左下角有开关 |
| 调整侧栏宽度 | 拖侧栏右边缘；双击恢复默认宽度 |
| 打开上一篇 / 下一篇 | 笔记底部的按钮，按文件名编号顺序 |

读到的位置会记住，下次打开接着看。最近打开的笔记列在侧栏。

## 加一个笔记文件夹

改 `vault.config.ts`，加一行就行：

```ts
{
  id: 'new-notes',                        // URL 里用的标识，定了就别改
  name: '新笔记',                          // 界面显示名
  root: 'D:/Somewhere/NewNotes',          // 绝对路径
  publish: 'never',                       // 见下
  note: '给未来的自己看的一句话备注',
}
```

保存后 Vite 会自动重启并重新扫描。

**`publish` 默认必须是 `never`。** 这是有意设计的：

- `public` —— 可以发布到云端，任何人可读
- `private` —— 发布但需登录（鉴权还没实现）
- `never` —— 永不发布，只在本地读

新加文件夹时如果忘了写 `publish`，它不会被发布出去。
反过来（默认公开 + 黑名单）的话，某天新建一个文件夹就会在没人察觉的情况下直接上云。

Xray 和 个人发展 是 `never`，因为里面有 SSH 私钥、真实服务器参数和私人材料——
不是「加个登录」的问题，而是云端不该存在它们的副本。理由写在 [docs/SPEC.md](docs/SPEC.md)。

> ⚠️ 2026-09-22 的一次发现印证了这条规矩的必要性：配 R2 时发现
> `https://cdn.tak1na.cn/aws.yaml` 之类的地址是**公开可下载**的，里面是带真实 uuid/reality 的代理配置。
> 那不是 MioNote 上传的（是桶里原有文件），但这说明「敏感文件不能和公开内容放在同一个存储里」
> 不是理论担忧。删掉文件不等于没泄露过——那套配置该换。

## 发布到云端（R2 + 静态站）

线上的形态是**纯公开静态站**：文本进仓库、构建时打进站点；图片放 R2。
**上传入口只有一条命令，它只在你本机跑**——线上是只读的，写能力不跟着前端走。

```bash
# 发布三步，按顺序
bun run sync            # 把 D: 上的文本镜像进 content/（提交进 git 的那一份）
bun run publish         # 图片增量上传到 R2（没变的不会重传）
bun run build           # 生成 dist/ 静态站，并核对上面两步做完了没有

# 核对
bun run scripts/preflight.ts        # 传之前：凭证、桶、写权限、公共域名，一次全查
bun run scripts/verify-upload.ts    # 传之后：逐张从公共域名 HEAD，比对字节数
bun run preview                     # 起静态站（用 http://localhost:4173，它只绑 IPv6 回环）
bun run scripts/verify-site.ts      # 对 preview 起的产物跑七项自检
```

当前部署（2026-09-22 首次上传：1078 张 / 387.1 MB / 66 秒）：

| | |
|---|---|
| 桶 | `file-bucket` |
| 桶内路径 | `file-bucket/MioNote/` ← 收在一个文件夹里，不和桶根上的别的文件混着 |
| 公共域名 | `https://cdn.tak1na.cn` |
| 样例图 | `https://cdn.tak1na.cn/MioNote/soft-exam/img2/Snipaste_2025-10-21_22-23-23.png?v=1d065ffd` |

**这个桶同时也装着你的私人文件**（`pdf_files/`、`印制电路工/`、几个 yaml 配置）。
前缀就是为这个准备的：MioNote 的东西全在 `MioNote/` 下，上传只写这里，
`--prune` 也只删自己账本里记过的对象（它从账本出发、不列桶）。
想彻底分开的话，建个新桶、改 `vault.config.ts` 的 `deploy.r2.bucket`、重跑 `bun run publish`。

```bash
bun run scripts/preflight.ts    # 传之前可以先看看桶里有什么、会不会和你的东西撞上
```

**首次要准备两件事**：

**1. Cloudflare 侧**：开通 R2 → 建一个桶（名字写进 `vault.config.ts` 的 `deploy.r2.bucket`）→
开公共访问（建议挂自定义域名，把域名填进 `deploy.r2.publicBase`）→ 建一个 R2 API Token
（权限选 Object Read & Write，只给这个桶），拿到 Access Key ID / Secret。

**2. 本机凭证**：复制 `.env.example` 为 `.env.local` 填进去。凭证只被 `scripts/publish.ts` 读，
`.gitignore` 里的 `*.local` 保证它不会被提交。

哪些东西会上传？**只有笔记正文真正引用到的图片**（1078 张 / 387 MB）——这个清单是解析 markdown
时算出来的，和渲染用的是同一份数据，所以不会漏传也不会多传没人看的图。
字体、音视频、demo 引用的图、没人引用的孤儿文件都不上传；因此**线上 demo 只提供「看源码」**，
不跑 iframe。取舍的完整理由见 [docs/SPEC.md 第九节](docs/SPEC.md)。

### 发布账本 `assets.manifest.json`

**这个文件要提交进 git。** 它记录每张图的内容哈希和是否已上传，是"图片在 R2 上"的真相来源。

这样安排的理由是：静态构建**不能依赖你的 D: 盘**（否则 CI 和换电脑都构建不了），
而图片又不进仓库，所以构建只能靠这份账本来知道图片存在。副产物是构建完全不发网络请求，
而且换台机器能构建出一模一样的产物。

**注意它和 `content/` 是两件事**：`content/` 是文本快照（对应笔记内容），
`assets.manifest.json` 是图片账本（对应 R2 上传状态）。两者都要提交。

## 目录结构

```
vault.config.ts            笔记从哪儿来 + 发布配置（唯一需要你改的文件）
.env.example               发布凭证的模板（复制成 .env.local 填真实值）
assets.manifest.json       图片上传账本（提交进 git，构建靠它知道图在不在）
shared/types.ts            内容契约：三个平台共用
plugins/vault/             Vite 插件 + 构建期逻辑
  scan.ts                    遍历文件夹、建内容树
  markdown.ts                解析标题 / 代码块 / 图片引用、自适应切分小节
  store.ts                   缓存、payload、搜索索引、路径边界检查、图片 URL 策略
  deploy.ts                  发布账本、上传集合、快照差异、R2 URL 生成
  build.ts                   静态站生成器（API JSON + 文本拷贝 + 产物自检）
  index.ts                   dev 接口与静态资源流式服务
scripts/generate-icons.mjs 从两个图标包生成 src/generated/icons.ts
scripts/sync-content.ts    D: 上的文本 → content/（发布快照）
scripts/publish.ts         图片 → R2（SigV4 直传，增量 + 断点续传）
scripts/build-site.ts      在 vite build 之后把 dist/ 补成静态站
scripts/verify-site.ts     对 preview 起的产物跑自检
content/                   提交进 git 的文本快照（构建输入，不用手改）
src/generated/icons.ts     生成产物（勿手改），bun run icons 重新生成
src/api/contentSource.ts   ContentSource 接口 + 按环境选实现
src/api/staticContentSource.ts  线上实现：读构建出来的 JSON，图片指向 R2
src/components/            界面
  FileIcon.tsx               文件/文件夹图标 + 名字解析
  Icon.tsx                   界面图标（搜索、关闭、主题…）
src/lib/search.ts          子串全文搜索
docs/SPEC.md               设计决定与理由，动手改之前先看它
```

## 图标

两套并用，跟 VS Code 自己的做法一致：

- **文件和文件夹** → [Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme)（彩色，`.md` 蓝、`.html` 橙、`.vue` 绿）
- **界面按钮** → [Codicons](https://github.com/microsoft/vscode-codicons)（VS Code 自己的界面图标，单色）

侧栏那 7 个笔记本的图标在 `vault.config.ts` 里用 `icon` 字段指定，可选项看
`src/generated/icons.ts` 里的 `FOLDER_ICONS`。改完跑 `bun run icons` 重新生成。

## 几个不能随便改的地方

- **标题取文件名，不取第一个 H1**。你的 H1 既当文档标题又当小节分隔符，
  取 H1 会让 `01_Vue实例-指令.md` 的标题变成「Vue」。
- **搜索是子串扫描，不是倒排索引**。386 KB 正文下子串更快，而且不用赌中文分词。
- **图片路径映射有三种结果**：外链 / 本地缺失 / 正常。外链和缺失混成一个值，
  断链报告就不可信了。
- **demo 的 iframe 需要 `allow-same-origin`**，否则用 XHR 的 demo 会被跨域策略拒掉。
- **展开动画用 `grid-template-rows: 0fr → 1fr`**，别改成 `max-height`——那要猜上限，
  还会被图片加载后的高度变化搞乱。
- **子树展开后不卸载**。一收起就卸载的话，收起动画没有内容可动。
- **图标是内联 SVG，不是图标字体**（字体包 13 MB，实际只用 200 个图标）。
  生成脚本做三件不能省的事：白名单过滤元素与属性、给 `id` 加图标前缀
  （117 个图标自带 id，内联到同一文档会互相覆盖）、处理 `circle`/`g`/`use` 等非 path 元素
  （只认 path 会让 `folder-css` 这类图标画残）。
- **文件夹名匹配不做子串包含**，只做整词和词首匹配。子串包含会让 `axios` 命中 `ios`、
  `routerlink` 命中 `out`。

完整的理由在 [docs/SPEC.md](docs/SPEC.md)。

## 还没做的

**上云剩下的**：静态构建（`dist/api/*.json` + `StaticContentSource`）、线上关闭 demo 的 iframe、
把图片 URL 从 `/@vault/` 换成 R2 域名、部署到 Workers Assets。
移动端和 Tauri 桌面壳也还没做。方向都记在 [docs/SPEC.md](docs/SPEC.md) 第六、九节。

发布**内容管道已经能用**了（`bun run sync` / `bun run publish`），缺的只是站点那一半。
