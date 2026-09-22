// setting模块
const state = {
  theme: 'light',
  desc: '测试demo'
}
const mutations = {
  updateTheme (state, newColor) {
    state.theme = newColor
  }
}
const actions = {
  updateThemeSecond (context, newColor) {
    setTimeout(() => {
      context.commit('updateTheme', newColor)
    }, 1000)
  }
}
const getters = {}

export default {
  // 开启命名空间，才可以使用子模块映射的语法
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
