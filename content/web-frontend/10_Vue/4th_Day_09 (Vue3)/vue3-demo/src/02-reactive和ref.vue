<script setup>
// 1. reactive：接受一个对象类型的数据，返回一个响应式的对象，当数据发生变化时，视图会自动更新
// import { reactive } from 'vue'
// const state = reactive({
//   count: 0
// })
// const setCount = () => {
//   state.count++
// }

// 2. ref：接受简单类型或者复杂类型，返回一个响应式对象
// 本质：是在原有传入数据的基础上，外层包了一层对象
// 底层：包成复杂类型之后，再借助 reactive 实现的响应式
// 注意：
// 1. ref 不能直接访问数据，需要通过 .value
// 2. 在 template 中，.value 不需要加（帮我们扒了一层）

// 推荐：以后声明数据，统一用 ref => 统一编码规范
import { ref } from 'vue'
const count = ref(0)

const setCount = () => {
  count.value++
}
</script>

<template>
  <div>
    <div>{{ count }}</div>
    <button @click="setCount">+1</button>
  </div>
</template>
