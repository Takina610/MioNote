// 项目的根组件

// 1. 定义组件
// function Button() {
//   return <button>点击</button>
// }
const Button = () => {
  return <button>点击</button>
}
function App() {
  return (
    <div className="App">
      {/* 2. 使用组件 (渲染组件) */}
      {/* 自闭和 */}
      <Button />

      {/* 成对标签 */}
      <Button></Button>
    </div>
  )
}

export default App
