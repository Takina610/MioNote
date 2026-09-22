// 1. 通过子传父 A -> App
// 2. 通过父传子 App -> B
import { useState } from 'react'

function A({onGetAName}) {
  // Son 组件中的数据
  const name = 'this is A name'
  return (
    <div>
      this is A component
      <button onClick={() => {
        // 子组件传递数据给父组件
        onGetAName(name)
      }}>
        Send To B
      </button>
    </div>
  )
}

function B({name}) {
  return (
    <div>
      this is B component,
      {name}
    </div>
  )
}

function App() {
  const [name, setName] = useState('')
  const getAName = (name) => {
    setName(name)
  }
  return (
    <div className="App">
      this is App
      <A onGetAName={getAName} />
      <B name={name} />
    </div>
  )
}

export default App
