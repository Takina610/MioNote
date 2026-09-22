<template>
  <div class="box">
    <h2>Son2 子组件</h2>
    从vuex中获取的值:<label>{{ $store.state.count }}</label>
    <br />
    <button @click="handleSub(1)">值 - 1</button>
    <button @click="subCount(5)">值 - 5</button>
    <button @click="updateTitle('😀😀')">改标题</button>
    <button @click="updateCount">一秒后将值改为666</button>

    <hr>
    <!-- 计算属性 getters -->
    <div>{{ $store.getters.filterList }}</div>

    <hr>
    <!-- 测试访问模块中的 state - 原生 -->
    <div>{{ $store.state.user.userInfo.name }}</div>
    <button @click="updateUserInfo">更新个人信息</button>
    <button @click="updateUserInfo2">一秒后更新个人信息</button>

    <div>{{ $store.state.setting.theme }}</div>
    <button @click="updateThemeColor">更新主题颜色</button>

    <hr>
    <!-- 测试访问模块中的 getters - 原生 -->
     <div>{{ $store.getters['user/UpperCaseName'] }}</div>
  </div>
</template>

<script>
import { mapMutations } from 'vuex'

export default {
  name: 'Son2Com',
  methods: {
    handleSub (n) {
      this.$store.commit('subCount', n)
    },
    handleTitle (newTitle) {
      this.$store.commit('updateTitle', newTitle)
    },
    ...mapMutations(['updateTitle', 'subCount']),
    updateCount () {
      // 调用 action
      // this.$store.dispatch('action名字', 额外参数)
      this.$store.dispatch('updateCountAction', 666)
    },

    // 提交模块的 mutation里的方法
    updateUserInfo () {
      // $store.commit('模块名/mutation名', 额外传参)
      this.$store.commit('user/updateInfo', 'ls')
    },
    updateThemeColor () {
      this.$store.commit('setting/updateTheme', 'pink')
    },

    updateUserInfo2 () {
      this.$store.dispatch('user/updateInfoSecond', 'ls')
    }
  }
}
</script>

<style lang="css" scoped>
.box {
  border: 3px solid #ccc;
  width: 400px;
  padding: 10px;
  margin: 20px;
}
h2 {
  margin-top: 10px;
}
</style>
