<script setup>
import { ref, provide } from 'vue';
import CenterCom from './components/center-com.vue'

// 1. 跨层传递普通数据
provide('theme-color', 'blue')
// 2. 跨层传递响应式数据
const count = ref(100)
provide('count', count)
setInterval(() => {
  count.value++
}, 1000)

// 3. 跨层传递函数 => 给子孙后代传递可以修改数据的方法
provide('changeCount', (newCount) => {
  count.value = newCount
})
</script>

<template>
  <div>
    <h1>我是顶层组件</h1>
    <CenterCom></CenterCom>
  </div>
</template>

