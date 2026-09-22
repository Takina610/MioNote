
import { useState } from "react"

// 封装自定义 hook
function useToggle() {
  // 可复用的逻辑代码
  const [value, setValue] = useState(true)
  const toggle = () => {
    setValue(!value)
  }
  return {
    value,
    toggle
  }
}

// 封装自定义 hook通用思路

// 1. 声明一个以 use打头的函数
// 2. 在函数体内封装可复用的逻辑（只要是可复用的逻辑）
// 3. 在组件中用到的状态或者回调 return出去（以对象或数组的形式）
// 4. 在那个组件中使用这个自定义 hook，就调用这个自定义 hook，然后使用返回的值

function App() {
  const {value, toggle} = useToggle()
  return (
    <div>
      {value && <h1>Hello</h1>}
      <button onClick={toggle}>toggle</button>
    </div>
  )
}

export default App
