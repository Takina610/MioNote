import Vue from 'vue'
import App from './App.vue'

import NumberBox from './components/NumberBox.vue'
Vue.component('NumberBox', NumberBox)

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
