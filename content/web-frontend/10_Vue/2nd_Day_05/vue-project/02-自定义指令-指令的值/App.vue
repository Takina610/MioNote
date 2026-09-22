<template>
  <div>
    <h1 v-color="color1">指令的值1测试</h1>
    <h1 v-color="color2">指令的值2测试</h1>
  </div>
</template>

<script>
export default {
  data () {
    return {
      color1: 'purple',
      color2: 'red'
    }
  },
  directives: {
    color: {
      // inserted提供的时元素被添加到页面中时的逻辑
      inserted (el, binding) {
        el.style.color = binding.value
      },
      // update提供的是指令的值修改的时候触发
      update (el, binding) {
        el.style.color = binding.value
      }
    }
  }
}
</script>

<style>

</style>