import { request } from '@/utils/request'

function loginAPI(data) {
  return request({
    url: '/authorizations',
    method: 'POST',
    data
  })
}

function getUserInfoAPI() {
  return request({
    url: '/user/profile',
    method: 'GET'
  })
}
export { loginAPI, getUserInfoAPI }