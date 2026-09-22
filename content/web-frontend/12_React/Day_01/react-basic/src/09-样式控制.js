// 项目的根组件

import './index.css'

const style = {
  color: 'red',
  fontSize: '20px',
}

function App() {
  return (
    <div className="App">
      {/* 行内样式控制 */}
      {/* <span style={{ color: 'red', fontSize: '20px' }}>this is span</span> */}
      <span style={style}>this is span</span>

      {/* 通过 className 控制样式 */}
      <span className="title">this is span</span>
    </div>
  )
}

export default App
