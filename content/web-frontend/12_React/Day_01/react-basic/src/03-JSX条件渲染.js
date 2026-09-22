// 项目的根组件
let isLogin = true

function App() {
  return (
    <div className="App">
      this is App
      {/* 逻辑与 && */}
      {isLogin && <div>欢迎回来</div>}

      {/* 三元运算符 */}
      {isLogin ? <div>欢迎回来</div> : <div>请登录</div>}
    </div>
  )
}

export default App
