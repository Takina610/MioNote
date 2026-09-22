<template>
  <div class="my-tag">
    <input
      v-if="isEdit"
      v-focus
      ref="inp"
      @blur="isEdit = false"
      class="input"
      type="text"
      placeholder="输入标签"
      :value="value"
      @keyup.enter="handleEnter"
    />
    <div v-else @dblclick="handleClick" class="text">
      {{ value }}
    </div>
  </div>
</template>

<script>
export default {
  props: {
    value: String
  },
  data () {
    return {
      isEdit: false
    }
  },
  methods: {
    handleClick () {
      // 双击后切换到显示状态
      this.isEdit = true
      // 全局注册
      // 等 dom更新完,再获取焦点
      // this.$nextTick(() => {
      //   this.$refs.inp.focus()
      // })
    },
    handleEnter (e) {
      if (e.target.value.trim() === '') return alert('标签内容为空')
      this.$emit('input', e.target.value)
      this.isEdit = false
    }
  }
}
</script>

<style lang="less" scoped>
  .my-tag {
    cursor: pointer;
    .input {
      appearance: none;
      outline: none;
      border: 1px solid #ccc;
      width: 100px;
      height: 40px;
      box-sizing: border-box;
      padding: 10px;
      color: #666;
      &::placeholder {
        color: #666;
      }
    }
  }
</style>