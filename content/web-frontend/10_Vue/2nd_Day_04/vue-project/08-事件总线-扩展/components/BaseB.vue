<template>
   <div class="base-b">
    <div>我是B组件（发布方）</div>
    <button @click="sendMsgFn">发送消息</button>
  </div>
</template>

<script>
import Bus from '../utils/EventBus'
export default {
  methods: {
    sendMsgFn () {
      // 3. 在 B组件（发送方）触发事件的方式传递参数（发布消息）
      Bus.$emit('sendMsg', '今天天气晴朗')
    }
  }
}
</script>

<style scoped>
.base-b {
  padding: 10px;
  width: 200px;
  height: 200px;
  border: 3px solid #000;
  border-radius: 3px;
  margin: 10px;
}
</style>