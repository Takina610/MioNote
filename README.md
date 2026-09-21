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
| 重新扫描 | 侧栏左上角的刷新图标（改完笔记一般会自动刷新） |
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

## 目录结构

```
vault.config.ts            笔记从哪儿来（唯一需要你改的文件）
shared/types.ts            内容契约：三个平台共用
plugins/vault/             Vite 插件：扫描、解析、HTTP 接口、文件监听
  scan.ts                    遍历文件夹、建内容树
  markdown.ts                解析标题 / 代码块 / 图片引用、自适应切分小节
  store.ts                   缓存、payload、搜索索引、路径边界检查
  index.ts                   接口与静态资源流式服务
scripts/generate-icons.mjs 从两个图标包生成 src/generated/icons.ts
src/generated/icons.ts     生成产物（勿手改），bun run icons 重新生成
src/api/contentSource.ts   ContentSource 接口（当前是 HTTP 实现）
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

云端部署、移动端、Tauri 桌面壳、编辑功能。都记在 `docs/SPEC.md` 第六节，
含已定的方向（移动端建议走 PWA）和还没定的问题（上云的发布路径）。
