<script setup>
// 父传子
// 1. 给子组件，添加属性的方式传值
// 2. 在子组件，通过 props 接收

// 局部组件（导入进来就能使用）
import { ref } from 'vue'
import SonCom from './components/son-com.vue'

const money = ref(100)
const getMoney = () => {
  money.value += 100
}

const changeFn = (newValue) => {
  money.value = newValue
}
</script>

<template>
  <div>
    <h3>
      父组件 - {{ money }}
      <button @click="getMoney">挣钱</button>
    </h3>
    <!-- 给子组件，添加属性的方式 传值 -->
    <SonCom @changeMoney="changeFn" car="宝马" :money="money"></SonCom>
  </div>
</template>

