import { useEffect, useState } from 'react'

function Son() {
  // 渲染开启一个定时器
  useEffect(() => {
    const timer = setInterval(() => {
      console.log('定时器执行中....')
    }, 1000)
    return () => {
      console.log('副作用函数卸载了')
      clearInterval(timer)
    }
  }, [])
  return <div>this is Son</div>
}

function App() {
  // 通过条件渲染模拟组件卸载
  const [show, setShow] = useState(true)
  
  return (
    <div className="App">
      {show && <Son />}
      <button onClick={() => setShow(false)}>卸载</button>
    </div>
  )
}

export default App
