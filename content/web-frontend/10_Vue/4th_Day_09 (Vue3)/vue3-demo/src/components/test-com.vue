<script setup>
const cnt = 99
const sayHi = () => {
  alert('Hi')
}
defineExpose({
  sayHi,
  cnt
})
</script>

<template>
  <div>我是用于测试的组件 - {{ cnt }}</div>
</template>
