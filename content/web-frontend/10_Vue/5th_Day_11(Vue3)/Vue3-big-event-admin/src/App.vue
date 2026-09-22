<script setup>
import { useRouter, useRoute } from 'vue-router'
// 在 Vue3 Composition API 中
// 1. 获取路由对象 router useRouter
const router = useRouter()
// 2. 获取路由参数 route useRoute
const route = useRoute()

import  zhCn  from 'element-plus/dist/locale/zh-cn.mjs'

</script>

<template>
  <div>
    <el-config-provider :locale="zhCn">
      <router-view></router-view>
    </el-config-provider>
  </div>
</template>

<style scoped></style>
