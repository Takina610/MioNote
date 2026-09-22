import { useEffect, useState } from 'react'

function App() {
  // 1. 没有依赖项  初始 + 组件更新 执行
  const [count, setCount] = useState(0)
  // useEffect(() => {
  //   console.log('副作用函数执行了，无依赖项')
  // })

  // 2. 有依赖，但为空数组 初始执行一次
  // useEffect(() => {
  //   console.log('副作用函数执行了，依赖项为空数组')
  // }, [])

  // 3. 传入特定依赖项，初始 和 依赖项发生变化时执行
  useEffect(() => {
    console.log('副作用函数执行了，依赖项发生变化')
  }, [count])
  return (
    <div className="App">
      this is App
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  )
}

export default App
