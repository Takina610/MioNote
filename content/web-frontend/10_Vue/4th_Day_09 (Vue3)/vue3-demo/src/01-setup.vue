<!-- <script>
export default {
  // setup
  // 1. 执行时机，比 beforeCreate 早
  // 2. setup 函数中，获取不到 this (this 是 undefined)
  // 3. 数据和函数，需要在 setup 最后 return，才能在 template 中使用
  setup() {
    // 数据
    const message = 'Hello Vue 3'
    // 函数
    const logMessage = () => {
      console.log(message)
    }
    // return {
    //   message,
    //   logMessage
    // }
  },
  beforeCreate() {
    console.log('beforeCreate 函数')
  }
}
</script> -->

  <!-- 问题：每次都要 return，好麻烦
  解决：通过 setup 语法糖，可以自动处理数据和函数的声明和返回
  4.直接在 script 后加上 setup 就不用 return 了 -->
<script setup>
  const message = 'Hello Vue 3'
  const logMessage = () => {
    console.log(message)
  }
</script>

<template>
  <div>message: {{ message }}</div>
  <button @click="logMessage">Log Message</button>
</template>
