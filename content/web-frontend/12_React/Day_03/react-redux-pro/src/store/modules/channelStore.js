import { createSlice } from "@reduxjs/toolkit"
import axios from "axios"

const channelStore = createSlice({
    name: "channel",
    initialState: {
        channelList: [],
    },
    reducers: {
        setChannelList(state, action) {
            state.channelList = action.payload
        },
    },
})

// 异步请求部分
const { setChannelList } = channelStore.actions

const fetchChannelList = () => {
    return async (dispatch) => {
        const response = await axios.get("http://geek.itheima.net/v1_0/channels")
        const data = response.data.data.channels
        dispatch(setChannelList(data))
    }
}

export { fetchChannelList }
export default channelStore.reducer
