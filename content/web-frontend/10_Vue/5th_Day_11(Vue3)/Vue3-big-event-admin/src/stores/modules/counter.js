import { defineStore } from 'pinia'
import { ref } from 'vue'

// 计数器模块
export const useCountStore = defineStore(
  'big-counter',
  () => {
    const count = ref(100)
    const add = () => {
      count.value++
    }
    return { count, add }
  },
  {
    persist: true,
  },
)
