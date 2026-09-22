import Login from '../page/Login'
import Article from '../page/Article'
import { createHashRouter } from 'react-router-dom'
import Layout from '../page/Layout'
import About from '../page/About'
import Board from '../page/Board'
import NotFound from '../page/NotFound'

const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        // path: '/about',
        // 设置为默认二级路由
        index: true,
        element: <About />,
      },
      {
        path: '/board',
        element: <Board />,
      },
    ],
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/article',
    element: <Article />,
  },
  {
    path: '/article/:id/:name',
    element: <Article />,
  },
  // 如果路由匹配不到，则匹配到此组件
  {
    path: '*',
    element: <NotFound />,
  },
])

export default router
