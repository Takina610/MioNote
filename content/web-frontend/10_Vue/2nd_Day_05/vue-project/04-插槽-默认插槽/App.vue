<template>
  <div>
    <!-- 在使用组件时，组件标签内插入内容 -->
    <MyDialog>
      你确认要删除吗
      <div>你确认要删除吗</div>
    </MyDialog>
    <MyDialog>
      你确认要退出吗
      <p>你确认要退出吗</p>
    </MyDialog>
  </div>
</template>

<script>
import MyDialog from "./components/MyDialog.vue"
export default {
  data() {
    return {}
  },
  components: {
    MyDialog,
  },
}
</script>

<style>
body {
  background-color: #b3b3b3;
}
</style>