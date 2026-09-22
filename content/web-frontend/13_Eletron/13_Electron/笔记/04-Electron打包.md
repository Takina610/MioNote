# Electron打包

## 使用 electron-builder 打包

使用 `electron-builder` 打包应用。

```bash
npm install electron-builder --save-dev
```

在 `package.json` 中添加以下脚本：

```json
{
  "name": "my-electron-app",
  "version": "1.0.0",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder" // 使用 `electron-builder` 打包应用程序，生成安装包
  },
  "build": {
    "appId": "com.atguigu.video",  // 应用程序的唯一标识符
    "win": {
      "icon":"./logo.ico",  // 应用图标
      "target": [
        {
          "target": "nsis", // 指定使用 NSIS 作为安装程序格式
          "arch": ["x64"] // 生成 64 位安装包
        }
      ]
    },
    "nsis": {
      "oneClick": false, // 设置为 false 使安装程序显示安装向导界⾯，而不是一键安装
      "perMachine": true, // 允许每台机器安装一次，而不是每个用户都安装
      "allowToChangeInstallationDirectory": true // 允许用户在安装过程中选择安装目录
    }
  },
  "author": "",
  "license": "ISC",
  "description": "",
  "devDependencies": {
    "electron": "^36.3.1",
    "electron-builder": "^26.0.12",
    "nodemon": "^3.1.10"
  }
}
```

执行 `npm run build` 命令，将会在 `dist` 目录下生成安装包。

## 使用 elctron-vite 打包

electron-vite 是一个新型构建工具

详情请见官网：https://cn-evite.netlify.app/ 