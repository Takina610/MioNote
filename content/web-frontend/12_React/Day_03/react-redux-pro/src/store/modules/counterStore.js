import { createSlice } from "@reduxjs/toolkit"

const countStore = createSlice({
    name: "counter",
    // 初始化 state
    initialState: {
      count: 0,
    },
    // 修改状态的方法 同步方法 支持直接修改
    reducers: {
      increment (state) {
        state.count++
      },
      decrement (state) {
        state.count--
      },
      reset (state) {
        state.count = 0
      },
      addToNum (state, action) {
        state.count = action.payload
      }
    },
})


// 解构出来 actionCreater函数
const { increment, decrement, reset, addToNum } = countStore.actions
// 获取 reducer
const reducer = countStore.reducer

// 以按需导出的方式导出 actionCreater
export { increment, decrement, reset, addToNum }
// 以默认导出的方式导出 reducer
export default reducer
