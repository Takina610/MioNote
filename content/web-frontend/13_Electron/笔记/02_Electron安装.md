# 安装 Electron

## 安装 Node.js

Electron 需要 Node.js 环境，请先安装 Node.js 环境。

## 安装 Electron

**初始化 npm 项目：**

```bash
mkdir my-electron-app
cd my-electron-app
npm init
```

这条命令会帮配置 `package.json` 中的一些字段。 为本教程的目的，有几条规则需要遵循：
- 入口点 应当是 `main.js`
- `author`、`license` 和 `description` 可以是任何值，但在稍后的packaging（打包） 中是必需的。

由于 `npm` 安装 Electron 巨慢，报错，换了镜像源也不好使，换了 `cnpm` 也是报错，一般都是网络超时导致的。

**将 Electron 安装为您项目的 devDependencies，即仅在开发环境需要的额外依赖：**

```bash
npm install electron --save-dev
```

**但是，此过程非常漫长，甚至可能会报错，换了镜像源也可能不行。换了cnpm 也是报错，一般都是网络超时导致的。**

**解决办法：**

- 尽可能的 升级 `node` 和 `npm` 到最新的稳定版本：https://nodejs.org/zh-cn
- 不要使用淘宝镜像源（会报404）如果你已经是淘宝镜像源了怎样修改配置看下面👇
- `cmd` 窗口执行：（打开 `npm` 的配置文件）
```bash
npm config edit
```
- 在配置文件中粘贴，并保存：
```txt
registry=https://registry.npmmirror.com
electron_mirror=https://cdn.npmmirror.com/binaries/electron/
electron_builder_binaries_mirror=https://npmmirror.com/mirrors/electron-builder-binaries/
```
- 重启 cmd 命令行工具（ vscode 或者其他 ide 也要重启一下，更稳妥）
- 执行下面命令清除npm的缓存：
```bash
npm cache clean --force
```
- 重新安装 Electron：
```bash
npm install electron --save-dev
```