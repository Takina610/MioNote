<template>
  <div class="app">
    <h4>父组件 -- <button>获取组件实例</button></h4>
    <BaseForm ref="baseForm"></BaseForm>
    <div>
      <button @click="handleGetValues">获取数据</button>
      <button @click="handleResetValues">重置数据</button>
    </div>
  </div>
</template>

<script>
import BaseForm from './components/BaseForm.vue'
export default {
  components: {
    BaseForm,
  },
  methods: {
   handleGetValues () {
    console.log(this.$refs.baseForm.getFormData() )
   },
   handleResetValues () {
    this.$refs.baseForm.resetFormData()
   }
  }
}
</script>

<style>
</style>