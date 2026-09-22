// 在 Node.js环境的代码中，应使用绝对路径
// 原因：代码的相对路径是以终端所在的文件夹为起点，而不是 Vscode资源管理器，容易造成目标文件找不到的错误
const fs = require('fs')
// 引入 path模块
const path = require('path')
// 调用 path.join() 配合 __dirname组成目标文件的绝对路径 
console.log(__dirname)
console.log(path.join(__dirname, 'test.txt'))
fs.readFile(path.join(__dirname, '../test.txt'),(error, data) => {
  if(error) console.log(error)
  else console.log(data.toString())
})