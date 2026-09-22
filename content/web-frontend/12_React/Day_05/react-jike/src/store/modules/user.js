import { createSlice } from "@reduxjs/toolkit"
import { getToken as _getToken, setToken as _setToken } from "@/utils"
import { loginAPI, getUserInfoAPI } from "@/apis/user"

const userStore = createSlice({
  name: 'user',
  initialState: {
    token: _getToken() || '',
    userInfo: {},
  },
  reducers: {
    setToken: (state, action) => {
      state.token = action.payload
      _setToken(action.payload)
    },
    setUserInfo: (state, action) => {
      state.userInfo = action.payload
    },
    clearUserInfo: (state) => {
      state.token = ''
      state.userInfo = {}
    }
    }
  })

const { setToken, setUserInfo, clearUserInfo } = userStore.actions

const fetchLogin = (loginForm) => {
  return async (dispatch) => {
    const res = await loginAPI(loginForm)
    dispatch(setToken(res.data.data.token))
    dispatch(fetchUserInfo())
  }
}

// 获取个人用户信息
const fetchUserInfo = () => {
  return async (dispatch) => {
    const res = await getUserInfoAPI()
    dispatch(setUserInfo(res.data.data))
  }
}

export default userStore.reducer

export {
  setToken,
  fetchLogin,
  clearUserInfo,
  fetchUserInfo
}

