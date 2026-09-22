import { createApp } from 'vue'
import { createPinia } from 'pinia'

// 导入持久化插件
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import App from './App.vue'

const pinia = createPinia() // 创建 pinia实例
const app = createApp(App) // 创建 vue实例
app.use(pinia.use(piniaPluginPersistedstate)) // 将 pinia挂载到 vue实例上
app.mount('#app') // 挂载 vue实例
