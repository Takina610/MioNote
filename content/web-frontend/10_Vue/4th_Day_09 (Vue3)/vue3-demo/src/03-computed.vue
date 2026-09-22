<script setup>
// const 计算属性 => computed(() => {
//   return 计算返回后的结果
//})

import { ref, computed } from 'vue'
// 声明数据
const list = ref([1, 2, 3, 4, 5, 6, 7, 8])

const computedList = computed(() => {
  return list.value.filter(item => item % 2 === 0)
})

const addFn = () => {
  list.value.push(Math.ceil(Math.random() * 100))
}
</script>

<template>
  <div>
    <div>原始数据：{{ list }}</div>
    <div>计算后的数据：{{ computedList }}</div>
    <button @click="addFn">修改</button>
  </div>
</template>
