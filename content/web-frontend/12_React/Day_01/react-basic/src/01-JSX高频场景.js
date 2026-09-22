// 项目的根组件

const count = 100
function fn() {
  return 'this is fn'
}
function App() {
  return (
    <div className="App">
      this is my first react app
      {/* 使用引号传递字符串 */}
      {'this is message'}

      {/* 识别js变量 */}
      {count}

      {/* 函数调用 */}
      {fn()}

      {/* 方法调用 */}
      {new Date().toLocaleString()}

      {/* 使用js对象 */}
      <div style={{color: 'red', fontSize: '20px'}}>this is div</div>
    </div>
  )
}

export default App
