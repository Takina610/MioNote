# Electron 运行

## 构建一个基本的工程

打开 `package.json`，在 `scripts` 字段中添加如下命令：`start: electron .`

```json
{
  "name": "my-electron-app",
  "version": "1.0.0",
  "description": "Hello World!", // 为后续能顺利打包，此处要编写描述。
  "main": "main.js", // 主进程入口文件
  "scripts": {
    "start": "electron .", //start命令用于启动整个应用
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "Jane Doe", // 为后续能顺利打包，此处要写明作者。
  "license": "MIT",
  "devDependencies": {
    "electron": "23.1.3"
  }
}
```

创建 `main.js` 文件，内容如下：

```js
const {app, BrowserWindow} = require('electron')

// 用于创建窗口
function createWindow () {
  const win = new BrowserWindow({
    width: 800, // 设置窗口宽度
    height: 600, // 设置窗口高度
    autoHideMenuBar: true, // 自动隐藏菜单栏
    // alwaysOnTop: true, // 窗口置顶（图层始终在最前端）
    // x: 0, // 窗口左上角x坐标
    // y: 0, // 窗口左上角y坐标
  })

  // 加载一个网页
  win.loadURL("https://www.baidu.com")
}

// 但 app 准备好后，执行 createWindow 函数创建窗口
app.on('ready', () => {
  createWindow()
})
```

> 关于 BrowserWindow 的更多配置项，请参考：[BrowserWindow实例属性](https://www.electronjs.org/zh/docs/latest/api/base-window#%E5%AE%9E%E4%BE%8B%E5%B1%9E%E6%80%A7)

启动应用：

```bash
npm start
```

**可以通过 `ctrl + shift + i` 打开开发者工具。**

**可以通过 `ctrl + r` 刷新页面。**

## 加载本地页面

创建 `pages/index.html` 文件，内容如下：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <link rel="stylesheet" href="./index.css">
</head>
<body>
  <h1>你好啊 Electron！！！!!!!</h1>
</body>
</html>
```

修改 `mian.js` 加载本地页面：

```js
win.loadFile('./pages/index.html')
```

## 完善窗口行为

-  Windows 和 Linux 平台窗口特点是：关闭所有窗口时退出应用。

```js
// 当所有窗口都关闭时
app.on('window-all-closed', () => {
  // 如果所处平台不是 mac(darwin)，则退出应用。
  if (process.platform !== 'darwin') app.quit()
})
```

- mac 应用即使在没有打开任何窗口的情况下也继续运行，并且在没有窗口可用的情况下激活应用时会打开新的窗口。

```js
// 但 app 准备好后，执行 createWindow 函数创建窗口
app.on('ready', () => {
  createWindow()
  // 当应用被激活时（针对 mac 平台）
  app.on('activate', () => {
    //如果当前应用没有窗口，则创建一个新的窗口
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})
```

## 配置自动重启

安装 `Nodemon`

```bash
npm i nodemon -D
```

修改 `package.json` 命令

```json
"scripts": {
 "start": "nodemon --exec electron ."
},
```

. 
配置 `nodemon.json` 规则，创建 `nodemon.json` 文件，内容如下：

```json
{
  "ignore": [
    "node_modules",
    "dist"
  ],
  "restartable": "r",
  "watch": ["*.*"],
  "ext": "html,js,css"
}
```

## Preload 脚本

预加载（Preload）脚本是**运行在渲染进程中的**，但它是在**网页内容加载之前执行的**，这意味着它具有比普通渲染器代码更高的权限，**可以访问 Node.js 的 API**，同时又可以与网页内容进行安全的交互。

简单说：它是 `Node.js` 和 `Web API` 的桥梁，Preload 脚本可以安全地将部分 `Node.js` 功能暴露给网页，从而减少安全风险。

创建 `preload.js` 文件（与 `main.js` 同级目录），内容如下：

```js
console.log('preload')

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('talkToRenderProcess', {
  talk: "hello from preload",
})
```

在主进程 `main.js` 中引入 `preload.js` ：

```js
const path = require('path')

const win = new BrowserWindow({
  webPreferences: {
    // 必须使用绝对路径才可用识别
    preload: path.resolve(__dirname, './preload.js') // 预加载脚本
  }
})
```


在 `index.html` 写好对应的交互页面：

```html
<button id="btn1">点我</button>
<script src="./render.js"></script>
```

在 渲染进程 `render.js` 中使用 `talk`：

```js
console.log('render')

const btn = document.getElementById('btn1')

btn.onclick = () => {
  console.log(window, talkToRenderProcess)
  alert(talkToRenderProcess.talk)
}
```

## 进程间通信

上文中的 `preload.js` ，**无法使用全部 Node 的 API** ，比如：不能使用 `Node` 中的 `fs` 模块，但主进程（`main.js`）是可以的，这时就需要让 `preload.js` 通知 `main.js` 去调用 `fs` 模块去干活。

关于 Electron 进程通信，我们要知道：
- **IPC** 全称为：**InterProcess Communication** ，即：**进程通信**。
-  IPC 是 Electron 中最为核心的内容，它是从 `UI` 调用原生 `API` 的唯一方法！
- Electron 中，主要使用 [ipcMain](https://www.electronjs.org/zh/docs/latest/api/ipc-main) 和 [ipcRenderer](https://www.electronjs.org/zh/docs/latest/api/ipc-renderer) 来定义 “通道”，进⾏进程通信。

### 渲染进程➡主进程（单向）

概述：在渲染器进程中 `ipcRenderer.send` 发送消息，在主进程中使用 `ipcMain.on` 接收消息。可以理解为消息队列的发布订阅模式。

> 需求：点击按钮后，创建一个hello.txt 文件，文件内容来自于用户输入。

**`index.html`**

```html
<input id="ipt" type="text">
<button id="btn2" >点我写入hello.txt</button>
```

**`render.js`**

```js
const btn2 = document.getElementById('btn2')
const input = document.getElementById('ipt')

btn2.onclick = () => {
  console.log(input.value)
  talkToRenderProcess.saveFile(input.value)
}
```

**`preload.js`**
`preload.js` 中使用 `ipcRenderer.send('信道',参数)` 发送消息，与主进程通信。

```js
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('talkToRenderProcess', {
  saveFile: (data) => {
    ipcRenderer.send('save-file', data)
  }
})
```

**`main.js`**
主进程中，在加载页面之前，使用 `ipcMain.on('信道',回调)` 配置对应回调函数，接收消息。
```js
const {app, BrowserWindow, ipcMain} = require('electron')
const fs = require('fs')
const path = require('path')

function writeFile(event, data) {
  console.log(event, data)
  fs.writeFileSync('D:/hello.txt', data)
}

function createWindow () {
  const win = new BrowserWindow({
    webPreferences: {
      preload: path.resolve(__dirname, './preload.js')
    }
  })

  // 监听信道
  ipcMain.on('save-file', writeFile)

  // 加载本地页面
  win.loadFile('./pages/index.html')
}
```

### 渲染进程↔主进程（双向）

概述：渲染进程通过 `ipcRenderer.invoke` 发送消息，主进程使用 `ipcMain.handle` 接收并处理消息。

`ipcRender.invoke` 的返回值是 `Promise` 实例。所以需要通过 `async` 和 `await` 来处理。

> 需求：点击按钮从 D 盘读取，例如下面的这个需求：hello.txt 中的内容，并将结果呈现在页面上。

**`index.html`**

```html
<button id="btn3">点我读取hello.txt</button>
<p id="content"></p>
```

**`render.js`**

```js
const btn3 = document.getElementById('btn3')
const content = document.getElementById('content')

btn3.onclick = async () => {
  const data = await talkToRenderProcess.readFile()
  content.innerText = data
}
```

**`preload.js`**
`preload.js` 中使用 `ipcRenderer.invoke('信道',参数)` 发送消息，与主进程通信

```js
contextBridge.exposeInMainWorld('talkToRenderProcess', {
  readFile() {
    return ipcRenderer.invoke('read-file')
  },
})
```

**`main.js`**
主进程中，在加载页面之前，使用 `ipcMain.handle('信道',回调)` 接收消息，并配置回调函数。

```js
function readFile() {
  return fs.readFileSync('D:/hello.txt').toString()
}

function createWindow () {
  // 监听信道
  ipcMain.handle('read-file', readFile)

  // 加载本地页面
  win.loadFile('./pages/index.html')
}
```

### 主进程➡渲染进程（单向）

概述：主进程使用 `win.webContents.send` 发送消息，渲染进程通过 `ipcRenderer.on` 处理消息。

> 需求：应用加载 6 秒钟后，主动给渲染进程发送一个消息，内容是：你好啊！

**`render.js`**

```js
function callBack(event, message) {
  console.log(event, message)
}

window.onload = () => {
  talkToRenderProcess.getMessage(callBack)
}
``` 

**`preload.js`**
`preload.js` 中使用 `ipcRenderer.send('信道',参数)` 接收消息，并将回调传递（将函数作为类看待就很好理解了）。

```js
contextBridge.exposeInMainWorld('talkToRenderProcess', {
  getMessage: (callback) => {
    ipcRenderer.on('message', callback)
  }
})
```

**`main.js`**
主进程中，在合适的时候，使用 `win.webContents.send('信道',参数)` 发送消息。

```js
function createWindow () {
  // 加载本地页面
  win.loadFile('./pages/index.html')

  setTimeout(() => {
    win.webContents.send('message', '你好啊！')
  }, 6000)
}
```

### 渲染进程↔渲染进程（双向）

概述：渲染进程和渲染进程的通信需要通过主进程来实现。

> 需求：渲染进程 A 点击按钮，渲染进程 B 接收到消息，并将结果呈现在页面上。

**`index.html`**

```html
<input id="ipt2" type="text">
<button id="btn4">向渲染进程2发送消息</button>
<h3>渲染进程2</h3>
<p id="content2">渲染进程2接收到来自渲染进程1的消息：</p>
<script src="./render2.js"></script>
```

**`render.js`**

```js
const ipt2 = document.getElementById('ipt2')
const btn4 = document.getElementById('btn4')

btn4.onclick = () => {
  talkToRenderProcess.sendMessage(ipt2.value)
}
```

**`render2.js`**
```js
const content2 = document.getElementById('content2')

function receive(event, message) {
  content2.innerText += message
}

talkToRenderProcess.receiveMessage(receive)
```

**`preload.js`**

```js
contextBridge.exposeInMainWorld('talkToRenderProcess', {
  sendMessage: (message) => {
    ipcRenderer.send('send-message', message)
  },
  receiveMessage: (message) => {
    ipcRenderer.on('receive-message', message)
  }
})
```

**`main.js`**

```js
// 用于创建窗口
function createWindow () {
  function sendMsg(_, message) {
    win.webContents.send('receive-message', message)
  }

  ipcMain.on('send-message', sendMsg)

  // 加载本地页面
  win.loadFile('./pages/index.html')
}
```