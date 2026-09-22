// 封装高阶组件
// 有token 则跳转
// 无token 则跳转登录

import { Navigate } from 'react-router-dom'
import { getToken } from '@/utils/token'

export function AuthRoute({ children }) {
  const token = getToken()
  if (token) {
    return <>{children}</>
  }
  return <Navigate to={"/login"} replace />
}
