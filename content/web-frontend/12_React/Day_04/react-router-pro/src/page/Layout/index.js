import { Outlet, Link } from 'react-router-dom'

const Layout = () => {
  return (
    <div>
      <h1>我是一级路由Layout</h1>
      {/* <Link to="/about">关于</Link> */}
      <Link to="/">关于</Link>
      <br />
      <Link to="/board">面板</Link>
      {/* 配置二级路由的出口 */}
      <Outlet />
    </div>
  )
}

export default Layout
