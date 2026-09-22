// 子传父
import { useState } from 'react'

function Son({onGetSonMsg}) {
  // Son 组件中的数据
  const sonMsg = 'this is son msg'
  return (
    <div>
      this is son
      <button onClick={() => {
        // 子组件传递数据给父组件
        onGetSonMsg(sonMsg)
      }}>
        传递数据
      </button>
    </div>
  )
}

function App() {
  const [msg, setMsg] = useState('')
  const getMsg = (msg) => {
    setMsg(msg)
  }
  return (
    <div className="App">
      this is App, {msg}
      <Son onGetSonMsg={getMsg} />
    </div>
  )
}

export default App
