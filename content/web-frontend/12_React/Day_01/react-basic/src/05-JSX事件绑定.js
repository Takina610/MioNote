// 项目的根组件

function App() {
  // const handleClick = () => {
  //   alert('点击了')
  // }

  // 事件参数 e
  // const handleClick = (e) => {
  //   alert('点击了')
  //   console.log(e)
  // }

  // 传递自定义参数
  // const handleClick = (name) => {
  //   alert('点击了' + name)
  // }

  // 既要自定义参数，又要事件参数 e
  const handleClick = (name, e) => {
    alert('点击了' + name)
    console.log(e)
  }
  return (
    <div className="App">
      <button onClick={(e) => handleClick('张三', e)}>点击</button>
    </div>
  )
}

export default App
