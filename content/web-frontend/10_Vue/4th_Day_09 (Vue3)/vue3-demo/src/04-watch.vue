<script setup>
import { ref, watch } from 'vue'
const count = ref(0)
const nickname = ref('张三')

const changeCount = () => {
  count.value++
}
const changeNickname = () => {
  nickname.value = '李四'
}

// 1. 监视单个数据的变化
// watch(count, (newValue, oldValue) => {
//   console.log('count', newValue, oldValue)
// })
// watch(nickname, (newValue, oldValue) => {
//   console.log('nickname', newValue, oldValue)
// })

// 2. 监视多个数据的变化
// watch([count, nickname], (newArr, oldArr) => {
//   console.log('watch', newArr, oldArr)
// })

// 3. immediate 立即执行
// watch(
//   [count, nickname],
//   (newArr, oldArr) => {
//     console.log('watch', newArr, oldArr)
//   },
//   {
//     immediate: true
//   }
// )

// 4. deep 深度监视，默认 watch 进行的是 浅层监视
//    const ref1 = ref(简单类型) 可以直接监视
//    const ref2 = ref(复杂类型) 监视不到复杂类型内部数据的变化
const userInfo = ref({
  name: 'zs',
  age: 18
})
const setUserInfo = () => {
  // 此时修改了 userInfo.value 对象的地址，默认的 watch才能监视到
  // userInfo.value = { name: 'ls', age: 19}

  userInfo.value.age++
  userInfo.value.name = 'ls'
}
// watch(
//   userInfo,
//   (newValue) => {
//     console.log('userInfo', newValue)
//   },
//   {
//     deep: true
//   }
// )

// 5. 对于对象中的属性，进行监视
watch(
  () => userInfo.value.age,
  (newValue, oldValue) => {
    console.log('userInfo.age', newValue, oldValue)
  }
)

</script>

<template>
  <div>{{ count }}</div>
  <button @click="changeCount">+1</button>
  <div>{{ nickname }}</div>
  <button @click="changeNickname">修改昵称</button>
  <div>{{ userInfo }}</div>
  <button @click="setUserInfo">修改userInfo</button>
</template>
