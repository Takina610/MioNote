<template>
  <div>
    <MyDialog>
      <!-- 需要通过 template标签，包裹成一个整体 -->
       <template v-slot:head>
        <div>我是大标题</div>
       </template>

       <template v-slot:content>
        我是内容
       </template>

       <template #footer>
        <button>确认</button>
        <button>取消</button>
       </template>
    </MyDialog>
  </div>
</template>

<script>
import MyDialog from './components/MyDialog.vue'
export default {
  data () {
    return {

    }
  },
  components: {
    MyDialog
  }
}
</script>

<style>
body {
  background-color: #b3b3b3;
}
</style>