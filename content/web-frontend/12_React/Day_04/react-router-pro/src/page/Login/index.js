import { Link, useNavigate } from 'react-router-dom'

const Login = () => {
  const navigate = useNavigate()
  return (
    <div>
      <h1>登录页</h1>
      {/* 声明式写法 */}
      <Link to="/article">跳转文章页</Link>
      {/* 命令式写法 */}
      <button onClick={() => navigate('/article')}>跳转文章页</button>
      <button onClick={() => navigate('/article?id=123&name=张三')}>
        searchParams传参
      </button>
      <button onClick={() => navigate('/article/123/张三')}>params传参</button>
    </div>
  )
}

export default Login
