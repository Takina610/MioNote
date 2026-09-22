// 文件核心作用：导入 App.vue，基于 App.vue创建结构渲染 index.html
import Vue from 'vue'
import App from './App.vue'

// 导入组件
import HmButton from './components/HmButton.vue'
Vue.config.productionTip = false

// 进行全局注册 -> 在所有组件范围内都可以直接使用
Vue.component('HmButton', HmButton)

// Vue实例化，提供 render方法 => 基于 App.vue创建结构渲染 index.html
new Vue({
  // el: '#app', 作用和.$mount('#app')作用一致
  // 创建元素结构
  render: h => h(App),
}).$mount('#app')
