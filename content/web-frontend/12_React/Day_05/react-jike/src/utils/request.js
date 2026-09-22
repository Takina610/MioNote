// # axios的封装处理
import axios from 'axios'
import { getToken, removeToken } from './token'
import router from '@/router'
import { message } from 'antd'
// TODO 1. 根域名配置
// TODO 2. 超时时间
const request = axios.create({
  baseURL: 'http://geek.itheima.net/v1_0',
  timeout: 5000
})

// TODO 3. 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 获取token
    const token = getToken()
    // 添加token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)
// TODO 4. 响应拦截器
request.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // 如果状态码是401，则跳转到登录页面
    if (error.response.status === 401) {
      removeToken()
      router.navigate('/login')
      window.location.reload()
      message.error('登录状态已过期，请重新登录')
    }
    return Promise.reject(error)
  }
)

export { request }


