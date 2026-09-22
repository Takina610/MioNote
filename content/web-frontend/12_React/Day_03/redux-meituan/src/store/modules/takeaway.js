import { createSlice } from "@reduxjs/toolkit"
import axios from "axios"

const foodsStore = createSlice({
    name: 'foods',
    initialState: {
      // 商品列表
      foodsList: [],
      // 菜单激活下标值
      activeIndex: 0,
      // 购物车列表
      cartList: []
    },
    reducers: {
      // 更改商品列表
        setFoodsList(state, action) {
            state.foodsList = action.payload
        },
        // 更改菜单激活下标值
        changeActiveIndex(state, action) {
            state.activeIndex = action.payload
        },
        // 添加购物车
        addCart(state, action) {
            // 判断商品是否已经在购物车中
            const item = state.cartList.find(item => item.id === action.payload.id)
            if (item) {
                // 如果商品已存在，数量加1
                item.count++
            } else {
                // 如果商品不存在，添加到购物车，初始数量为1
                state.cartList.push({
                    ...action.payload,
                    count: 1
                })
            }
        },
        // count增
        increCount(state, action) {
          // 通过 id找到商品
            const item = state.cartList.find(item => item.id === action.payload.id)
            item.count++
        },
        // count减
        decreCount(state, action) {
            // 通过 id找到商品
            const item = state.cartList.find(item => item.id === action.payload.id) 
            if (item.count > 1) {
                item.count--
            }
        },
        // 清空购物车
        clearCart(state, action) {
            state.cartList = []
        }
    }
})

// 异步获取部分
const { setFoodsList, changeActiveIndex, addCart, increCount, decreCount, clearCart} = foodsStore.actions
const fetchFoodsList = () => {
  return async (dispatch) => {
    const res = await axios.get('http://localhost:3004/takeaway')
    dispatch(setFoodsList(res.data))
  }
}

export default foodsStore.reducer
export { fetchFoodsList, changeActiveIndex, addCart, increCount, decreCount, clearCart }
