// 父传子

// 1. 父组件传递数据 子组件标签身上绑定属性
// 2. 子组件接收数据 通过 props 接收数据

function Son(props) {
  // props：对象里面包含了父组件传递过来的所有数据
  // {name: '张三'}
  return <div>Son: {props.name}</div>
}

function App() {
  const name = '张三'
  return (
    <div className="App">
      <Son name={name} />
    </div>
  )
}

export default App
