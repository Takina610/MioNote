// 项目的根组件

import { useState } from 'react'

function App() {
  let [count, setCount] = useState(0)

  const handleClick = () => {
    // 直接修改 无法引发视图更新
    // count++
    setCount(count + 1)
  }

  // 修改对象状态
  const [obj, setObj] = useState({ name: '张三' })
  const changeObj = () => {
    // 直接修改 无法引发视图更新
    // obj.name = '李四'
    setObj({ ...obj, name: '李四' })
    // setObj({ name: '李四' })
  }
  return (
    <div className="App">
      <button onClick={handleClick}>点击</button>
      <p>{count}</p>

      <button onClick={changeObj}>修改对象</button>
      <p>{obj.name}</p>
    </div>
  )
}

export default App
