// user模块
const state = {
  userInfo: {
    name: 'zs',
    age: 18
  },
  score: 80
}
const mutations = {
  updateInfo (state, newInfo) {
    state.userInfo.name = newInfo
  }
}
const actions = {
  updateInfoSecond (context, newInfo) {
    setTimeout(() => {
      // 调用 mutaion，context上下文，默认提交的就是自己模块的 mutation方法
      context.commit('updateInfo', newInfo)
    }, 1000)
  }
}
const getters = {
  UpperCaseName (state) {
    return state.userInfo.name.toUpperCase()
  }
}

export default {
  // 开启命名空间，才可以使用子模块映射的语法
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
