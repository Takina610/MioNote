<script setup>
// 用于定义组件的选项。它允许你在组件内部以更简洁的方式设置组件的配置项
defineOptions({
  name: 'App',
  props: {
    message: String
  },
  emits: ['custom-event']
})
</script>

<template>
  <div>{{ message }}</div>
</template>
