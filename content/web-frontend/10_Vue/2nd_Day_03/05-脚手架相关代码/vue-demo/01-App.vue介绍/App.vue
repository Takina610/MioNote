<template>
  <div id="App">
    <div id="box" @click="fn"></div>
  </div>
</template>

<script>
  // 导出的是当前组件的配置项
  // 里面可以提供 data（特殊）methods computed watch 八大生命周期钩子
  export default {
    methods: {
      fn() {
        alert("你好")
      }
    }
  }
</script>

<style lang="less">
/* 让 style支持 less
    1. 给 style加上 lang="less"
    2. 安装依赖包 less less-loader
    yarn add less less-loader -D（开发依赖）
*/
  #App {
    width: 400px;
    height: 400px;
    background-color: pink;
  }
  #App #box {
    width: 100px;
    height: 100px;
    background-color: deepskyblue;
  }
</style>