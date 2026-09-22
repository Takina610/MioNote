<template>
  <div class="App">
    <!-- 头部组件 -->
    <HmHeader></HmHeader>
    <!-- 主体组件 -->
    <HmMain></HmMain>
    <!-- 底部组件 -->
    <HmFooter></HmFooter>
  </div>
</template>

<script>
// 导入需要注册的对象
import HmHeader from './components/HmHeader.vue'
import HmMain from './components/HmMain.vue'
import HmFooter from "./components/HmFooter.vue"

export default {
  // 局部注册
  components: {
    HmHeader: HmHeader,
    HmMain,
    HmFooter
  }
}
</script>

<style>
  .App {
    width: 600px;
    height: 700px;
    background-color: deepskyblue;
    margin: 0 auto;
    padding: 20px;
  }
</style>