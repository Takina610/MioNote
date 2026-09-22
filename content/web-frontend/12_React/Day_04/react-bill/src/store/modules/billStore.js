// 账单列表相关 store
import { createSlice } from '@reduxjs/toolkit'
import axios from 'axios'

const billStore = createSlice({
  name: 'bill',
  initialState: {
    billList: [],
  },
  reducers: {
    setBillList: (state, action) => {
      state.billList = action.payload
    },
    // # 添加账单
    addBill: (state, action) => {
      state.billList.push(action.payload)
    },
  },
})
const { setBillList, addBill } = billStore.actions

// 编写异步
const getBillList = () => {
  return async (dispatch) => {
    const res = await axios.get('http://localhost:8000/ka')
    dispatch(setBillList(res.data))
  }
}

const addBillList = (data) => {
  return async (dispatch) => {
    const res = await axios.post('http://localhost:8000/ka', data)
    dispatch(addBill(res.data))
  }
}

export default billStore.reducer
export { getBillList, addBillList }
