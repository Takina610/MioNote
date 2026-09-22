<script setup>
import { onMounted, ref } from 'vue'
import TestCom from './components/test-com.vue'

// 模板引用（可以获取到 dom，也可以获取组件）
// 1. 调用 ref函数，生成一个 ref对象
// 2. 通过 ref标识，进行绑定
// 3. 通过 ref对象.value 即可访问到绑定的元素（必须等到元素渲染完才可以获取到）
const inp = ref(null)

// 生命周期钩子
onMounted(() => {
  // console.log(inp.value)
})
const clickFn = () => {
  inp.value.focus()
}

// ----------------------------
const comRef = ref(null)
const getCom = () => {
  console.log(comRef.value)
  comRef.value.sayHi()
}
</script>

<template>
  <div>
    <input ref="inp" type="text">
    <button @click="clickFn">点击让输入框聚焦</button>
  </div>
  <TestCom ref="comRef"></TestCom>
  <button @click="getCom">获取组件</button>
</template>

