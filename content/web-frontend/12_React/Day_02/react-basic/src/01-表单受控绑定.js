// 受控绑定表单

import { useState } from 'react'

// 1. 声明一个 react 状态 - useState

// 2. 核心绑定流程
// 3. 通过 value属性绑定 react状态
// 4. 绑定 onChange事件 通过时间参数 e拿到输入框最新的值 方向修改到 react状态

function App() {
  const [value, setValue] = useState('')

  return (
    <div className="App">
      <input 
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <p>{value}</p>
    </div>
  )
}

export default App
