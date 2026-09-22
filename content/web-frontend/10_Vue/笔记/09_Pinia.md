# Pinia

## 什么是Pinia

Pinia 是 Vue 的最新 **状态管理工具** ，是 Vuex 的 **替代品**。

## 优点

1. 提供更加简单的 API （去掉了 mutation ）
2. 提供符合，组合式风格的 API （和 Vue3 新语法统一）
3. 去掉了 modules 的概念，每一个 store 都是一个独立的模块
4. 配合 TypeScript 更加友好，提供可靠的类型推断

## 手动添加Pinia到Vue项目

在实际开发项目的时候，关于Pinia的配置，可以在项目创建时自动添加

现在我们初次学习，从零开始：
1. 使用 Vite 创建一个空的 Vue3 项目

```bash
npm create vue@latest
```

2. **按照官方文档** 安装 pinia 到项目中

```bash
npm install pinia
```

在 `src/main.js` 中，引入 pinia 并创建实例：

```js
import { createApp } from 'vue'
import { createPinia } from 'pinia' // 导入 pinia

import App from './App.vue'

const pinia = createPinia() // 创建 pinia实例
const app = createApp(App) // 创建 vue实例
app.use(pinia) // 将 pinia挂载到 vue实例上
app.mount('#app') // 挂载 vue实例
```

## 基础使用

1. 定义store

**`src/store/counter.js`**

```js
import { defineStore } from "pinia"
import { ref } from "vue"

// 定义 store
// defineStore(仓库的唯一标识, () => {...})
export const useCounterStore = defineStore('counter', () => {
  // 声明数据 state - count
  const count = ref(100)

  // 声明操作数据的方法 action (普通函数)
  const addCount = () => count.value++
  const subCount = () => count.value--

  // 返回数据
  return {
    count,
    addCount,
    subCount,
  }
})
```

2. 组件使用 store

```html
<script setup>
// 1. 导入 `useCounterStore` 方法
import { useCounterStore } from './store/counter'

// 2. 执行方法得到 counterStore 对象
const counterStore = useCounterStore()
</script>

<template>
  <div>
    {{ counterStore.count }}
    <button @click="counterStore.addCount">+</button>
    <button @click="counterStore.subCount">-</button>
  </div>
</template>
```

## getters

Pinia 中的 getters 直接使用 **computed函数** 进行模拟, 组件中需要使用**需要把 getters return出去**

**`src/store/counter.js`**

```js
import { defineStore } from "pinia"
import { ref } from "vue"
import { computed } from "vue"

export const useCounterStore = defineStore('counter', () => {
  const count = ref(100)

  const addCount = () => count.value++
  const subCount = () => count.value--

  // 声明基于数据派生的计算属性 getters (computed)
  const doubleCount = computed(() => count.value * 2)

  // 返回数据
  return {
    count,
    addCount,
    subCount,
    doubleCount
  }
})
```

## action异步

编写方式：异步 action 函数的写法和**组件中获取异步数据的写法完全一致**

**`src/store/channel.js`**

```js
import axios from "axios"
import { defineStore } from "pinia"
import { ref } from "vue"

export const useChannelStore = defineStore('channel', () => {
  // 声明数据
  const channelList = ref([])
  // 声明操作数据的方法
  const getList = async () => {
    // 支持异步操作
    const { data: { data } } = await axios.get('http://geek.itheima.net/v1_0/channels')
    channelList.value = data.channels
  }

  // 声明 getters 相关
  return {
    channelList,
    getList
  }
})
```

**`src/App.vue`**

```html
<script setup>
import { useChannelStore } from "./store/channel"

const channelStore = useChannelStore()
</script>

<template>
  <div>
    <button @click="channelStore.getList">获取频道数据</button>
    <ul>
      <li v-for="item in channelStore.channelList " :key=item.id>{{ item.name }}</li>
    </ul>
  </div>
</template>
```

## storeToRefs工具函数

使用 storeToRefs 函数可以辅助保持数据 **（state + getter）** 的响应式解构

```js
const counterStore = useCounterStore()

// 响应式丢失，视图不更新
const {count, doubleCount} = counterStore

// 使用 storeToRefs 解决
const { count, doubleCount } = storeToRefs(counterStore)
```

**`src/App.vue`**

```html
<script setup>
import { useCounterStore } from "@/store/counter"
import { useChannelStore } from "./store/channel"
import { storeToRefs } from "pinia"

const counterStore = useCounterStore()
const channelStore = useChannelStore()

// 此时，如果直接解构，不处理，数据会丢失响应式
// const { count, msg } = counterStore
// 使用 storeToRefs() 解决
const { count, msg } = storeToRefs(counterStore)
const { channelList } = storeToRefs(channelStore)

// 如果直接解构方法，则不需要 stroeToRefs()
const { getList } = channelStore
</script>

<template>
  <div>
    {{ count }}
    {{ msg }}
    {{ counterStore.doubleCount }}
    <button @click="getList">获取频道数据</button>
    <ul>
      <li v-for="item in channelList " :key=item.id>{{ item.name }}</li>
    </ul>
  </div>
</template>
```

## Pinia持久化插件

1. 安装插件 pinia-plugin-persistedstate

```bash
npm install pinia-plugin-persistedstate
```

2. main.js 使用

```js
import { createApp } from 'vue'
import { createPinia } from 'pinia'

// 导入持久化插件
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import App from './App.vue'

const pinia = createPinia() // 创建 pinia实例
const app = createApp(App) // 创建 vue实例
app.use(pinia.use(piniaPluginPersistedstate)) // 将 pinia挂载到 vue实例上
app.mount('#app') // 挂载 vue实例
```

3. 在 store 中配置 persist

```js
import { defineStore } from "pinia"
import { ref } from "vue"
import { computed } from "vue"

export const useCounterStore = defineStore('counter', () => {
  // ...

  return {
    // ...
  }
}, {
  // persist: true // 开启当前模块的持久化
  persist: {
    key: 'ljh-counter', // 修改本地存储的唯一标识
    paths: ['count'] // 存储的是哪些数据
  }
})
```

# pnpm

一些优势：比同类工具快2倍左右、节省磁盘空间...https://www.pnpm.cn/

安装方式：

```bash
npm install -g pnpm
```

创建项目：

```bash
pnpm create vue
```

# vue-router4

1. 路由初始化

```js
import { useUserStore } from '@/stores'
import { createRouter, createWebHistory } from 'vue-router'

// createRouter 创建路由实例
// 配置 history 模式
// 1. history 模式：createWebHistory 地址栏不带 #
// 2. hash 模式：createWebHashHistory 地址栏带 #

// vite 中的环境变量 import.meta.env.BASE_URL
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: []
})

export default router
```

**`vite.config.js`**

```js
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
```

**`src/router/index.js`**

```js
import { useUserStore } from '@/stores'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', component: () => import('@/views/login/LoginPage.vue') },
    {
      path: '/',
      component: () => import('@/views/layout/LayoutContainer.vue'),
      redirect: '/article/manage',
      children: [
        { path: '/article/manage', component: () => import('@/views/article/ArticleManage.vue') },
      ]
    }
  ],
})

export default router
```