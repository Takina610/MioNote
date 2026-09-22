// 这里存放的是 vuex相关的核心代码
import Vue from 'vue'
import Vuex from 'vuex'

// 导入模块
import user from './modules/user'
import setting from './modules/setting'
// 插件安装
Vue.use(Vuex)

// 创建空仓库
const store = new Vuex.Store({
  // 严格模式 （有利初学者，检测不规范的代码，上线时需要移除）
  strict: true,
  // 1. 通过 state可以提供数据（所有组件共享的数据）
  state: {
    title: '大标题',
    count: 100,
    list: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  },
  // 2. 通过 mutations可以提供修改数据的方法
  mutations: {
    // 所有 mutations函数，第一个参数都是 state
    // mutations参数有且只能有一个，如果需要多个参数，包装成一个对象即可
    addCount (state, n) {
      state.count += n
    },
    subCount (state, n) {
      state.count -= n
    },
    updateTitle (state, newTitle) {
      state.title = newTitle
    },
    updateCount (state, newCount) {
      state.count = newCount
    }
  },
  // 3. actions处理异步
  // 注意：不能直接操作 state，操作 state还是需要 commit mutation
  actions: {
    // context 上下文 （此处未分模块，可以当成 store仓库）
    // context.commit('mutation名字', 额外参数)
    updateCountAction (context, num) {
      // 这里是 setTimeout模拟异步，以后大部分场景是发请求
      setTimeout(() => {
        context.commit('updateCount', num)
      }, 1000)
    }
  },
  // 4. getters类似于计算属性
  getters: {
    // 注意点：
    // 1. 形参第一个参数，就是 state
    // 2. 必须有返回值，返回值就是 getters的值
    filterList (state) {
      return state.list.filter(item => item > 5)
    }
  },
  // 5. modules模块
  modules: {
    user,
    setting
  }
})

// 导出给 main.js使用
export default store
