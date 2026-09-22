<template>
  <div class="app">
    我是APP组件
    <button @click="change">修改数据</button>
    <SonA></SonA>
    <SonB></SonB>
  </div>
</template>

<script>
import SonA from './components/SonA.vue'
import SonB from './components/SonB.vue'
export default {
  provide () {
    return {
      color: this.color,
      userInfo: this.userInfo
    }
  },
  data() {
    return {
      color: 'pink', // 简单类型（非响应式）
      userInfo: { // 复杂类型（响应式）
        name: 'zs',
        age: 18,
      },
    }
  },
  methods: {
    change () {
      this.name = 'green',
      this.userInfo.name = 'ls',
      this.userInfo.age = 20
    }
  },
  components: {
    SonA,
    SonB,
  },
}
</script>

<style>
.app {
  border: 3px solid #000;
  border-radius: 6px;
  margin: 10px;
}
</style>