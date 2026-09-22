// 加载 fs模块对象
const fs = require('fs')
// 写入文件内容
fs.writeFile('./test.txt', 'hello node.js', error => {
  if(error) console.log(error)
  else console.log('写入成功')
})

fs.readFile('./test.txt',(error, data) => {
  if(error) console.log(error)
  // data是 buffer 16进制数据流对象
  // toString()转换成字符串
  else console.log(data.toString())
})