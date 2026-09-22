<script setup>
import Son1Com from "./components/Son1Com.vue"
import Son2Com from "./components/Son2Com.vue"
import { useCounterStore } from "@/store/counter"
import { useChannelStore } from "./store/channel"
import { storeToRefs } from "pinia"

const counterStore = useCounterStore()
const channelStore = useChannelStore()

// 此时，如果直接解构，不处理，数据会丢失响应式
// const { count, msg } = counterStore
// 使用 storeToRefs() 解决
const { count, msg } = storeToRefs(counterStore)
const { channelList } = storeToRefs(channelStore)

// 如果直接解构方法，则不需要 stroeToRefs()
const { getList } = channelStore
</script>

<template>
  <div>
    <h3>App.vue根组件
      - {{ count }}
      - {{ msg }}
      - {{ counterStore.doubleCount }}</h3>
    <Son1Com></Son1Com>
    <Son2Com></Son2Com>
    <hr>
    <button @click="getList">获取频道数据</button>
    <ul>
      <li v-for="item in channelList " :key=item.id>{{ item.name }}</li>
    </ul>
  </div>
</template>

<style scoped>

</style>
