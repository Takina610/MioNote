// 项目的根组件

// 定义文章类型
// 根据不同的文章类型返回不同的JSX模板
function getArticle(type) {
  if (type === 0) {
    return <div>我是无图文章</div>
  } else if (type === 1) {
    return <div>我是单图文章</div>
  } else {
    return <div>我是三图文章</div>
  }
}

function App() {
  return (
    <div className="App">
      {getArticle(0)}
      {getArticle(1)}
      {getArticle(3)}
    </div>
  )
}

export default App
