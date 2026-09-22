import { useSelector, useDispatch } from "react-redux"
import { increment, decrement, reset, addToNum } from "./store/modules/counterStore"
import { fetchChannelList } from "./store/modules/channelStore"
import { useEffect } from "react"

function App() {
  const count = useSelector(state => state.counter.count)
  const channelList = useSelector(state => state.channel.channelList)
  const dispatch = useDispatch()
  // 使用 useEffect触发异步请求执行
  useEffect(() => {
    dispatch(fetchChannelList())
  }, [dispatch])
  return (
    <div className="App">
      <h1>计数器</h1>
      <p>当前计数：{count}</p>
      <button onClick={() => dispatch(increment())}>增加</button>
      <button onClick={() => dispatch(decrement())}>减少</button>
      <button onClick={() => dispatch(reset())}>重置</button>
      <br />
      <button onClick={() => dispatch(addToNum(10))}>增加到10</button>
      <button onClick={() => dispatch(addToNum(20))}>增加到20</button>
      <br />
      <ul>
        {channelList.map(channel => (
          <li key={channel.id}>{channel.name}</li>
        ))}
      </ul>
    </div>
  )
}

export default App
