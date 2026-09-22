// 项目的根组件

// useState实现一个计数器按钮

// 1. 导入 useState 钩子
import { useState } from 'react'

function App() {
  // 2. 使用 useState 钩子
  // count 是状态变量
  // setCount 是更新状态的方法
  const [count, setCount] = useState(0)

  // 3. 使用 setCount 方法更新 count 的值
  const handleClick = () => {
    setCount(count + 1)
  }

  return (
    <div className="App">
      <button onClick={handleClick}>点击</button>
      <p>{count}</p>
    </div>
  )
}

export default App
