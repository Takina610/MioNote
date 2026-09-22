<script setup>
// 1. 导入 `useCounterStore` 方法
import { useCounterStore } from '@/store/counter'

// 2. 执行方法得到 counterStore 对象
const counterStore = useCounterStore()
</script>

<template>
  <div>
    我是Son1.vue - {{ counterStore.count }} <button @click="counterStore.addCount">+</button>
  </div>
</template>

<style scoped>

</style>
