const {app, BrowserWindow, ipcMain} = require('electron')
const fs = require('fs')
const path = require('path')

function writeFile(_, data) {
  fs.writeFileSync('E:/University Code Learning Journey/Web Front-end development/13_Electron/hello.txt', data)
}

function readFile() {
  return fs.readFileSync('E:/University Code Learning Journey/Web Front-end development/13_Electron/hello.txt').toString()
}



// 用于创建窗口
function createWindow () {
  const win = new BrowserWindow({
    width: 800, // 设置窗口宽度
    height: 600, // 设置窗口高度
    autoHideMenuBar: true, // 自动隐藏菜单栏
    // alwaysOnTop: true, // 窗口置顶（图层始终在最前端）
    // x: 0, // 窗口左上角x坐标
    // y: 0, // 窗口左上角y坐标
    webPreferences: {
      // 必须使用绝对路径才可用识别
      preload: path.resolve(__dirname, './preload.js') // 预加载脚本
    }
  })

  function sendMsg(_, message) {
    win.webContents.send('receive-message', message)
  }

  ipcMain.on('save-file', writeFile)
  ipcMain.handle('read-file', readFile)

  ipcMain.on('send-message', sendMsg)
  // 加载一个网页
  // win.loadURL("https://www.baidu.com")
  // 加载本地页面
  win.loadFile('./pages/index.html')

  setTimeout(() => {
    win.webContents.send('message', '你好 render')
  }, 3000)
}

// 但 app 准备好后，执行 createWindow 函数创建窗口
app.on('ready', () => {
  createWindow()
  // 当应用被激活时（针对 mac 平台）
  app.on('activate', () => {
    //如果当前应用没有窗口，则创建一个新的窗口
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 当所有窗口都关闭时
app.on('window-all-closed', () => {
  // 如果所处平台不是 mac(darwin)，则退出应用。
  if (process.platform !== 'darwin') app.quit()
})

console.log(process.versions.chrome)
console.log(process.versions.electron)
