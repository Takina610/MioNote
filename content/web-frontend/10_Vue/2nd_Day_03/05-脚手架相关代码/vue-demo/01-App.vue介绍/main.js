// 文件核心作用：导入 App.vue，基于 App.vue创建结构渲染 index.html
// 1. 导入 Vue核心包
import Vue from 'vue'
// 2. 导入 App.vue根组件
import App from './App.vue'

// 提示：当前处于什么环境（生存环境 / 开发环境）
Vue.config.productionTip = false

// 3. Vue实例化，提供 render方法 => 基于 App.vue创建结构渲染 index.html
new Vue({
  // el: '#app', 作用和.$mount('#app')作用一致
  // 创建元素结构
  render: h => h(App),
}).$mount('#app')
