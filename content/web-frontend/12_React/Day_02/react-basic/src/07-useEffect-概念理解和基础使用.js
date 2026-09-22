import { useState, useEffect } from 'react'

const URL = 'http://geek.itheima.net/v1_0/channels'

function App() {
  const [channels, setChannels] = useState([])
  useEffect(() => {
    // 额外的请求，获取频道列表
    fetch(URL).then(res => res.json()).then(data => {
      setChannels(data.data.channels)
    })
  }, [])
  return (
    <ul className="App">
      {channels.map(channel => (
        <li key={channel.id}>{channel.name}</li>
      ))}
    </ul>
  )
}

export default App
