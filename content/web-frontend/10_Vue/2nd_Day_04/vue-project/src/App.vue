<template>
  <div class="app">
    <div v-if="isShowEdit">
      <input type="text" v-model="editValue" ref="inp" />
      <button>确认</button>
    </div>
    <div v-else>
      <span>{{ title }}</span>
      <button @click="handleEdit">编辑</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      title: '大标题',
      isShowEdit: false,
      editValue: '',
    }
  },
  methods: {
   handleEdit () {
    this.isShowEdit = true
    // 等 Dom更新后，才会触发执行里面的方法体
    this.$nextTick(() => {
      this.$refs.inp.focus()
    })
   }
  },
}
</script>

<style>
</style>