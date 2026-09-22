<template>
  <div class="box">
    <h2>Son1 子组件</h2>
    从vuex中获取的值:<label>{{ count }}</label>
    <br>
    <button @click="handleAdd(1)">值 + 1</button>
    <button @click="handleAdd(5)">值 + 5</button>
    <button @click="addCount(10)">值 + 10</button>
    <button @click="updateCountAction(888)">一秒后将值改为888</button>

    <hr>
    <!-- 计算属性 getters -->
    <div>{{ filterList }}</div>

    <hr>
    <!-- 访问模块中的 state -->
    <div>{{ user.userInfo.name }}</div>
    <div>{{ setting.theme }}</div>

    <hr>
    <!-- 通过子模块映射访问 state -->
    <div>{{ userInfo }}</div>
    <button @click="updateInfo('ls')">更新个人信息(通过子模块映射)</button>

    <div>{{ theme }} - {{ desc }}</div>
    <button @click="updateTheme('pink')">更新主题颜色(通过子模块映射)</button>
    <button @click="updateThemeSecond('pink')">一秒后更新主题颜色(通过子模块映射)</button>

    <hr>
    <!-- 访问模块中的 getters（模块映射） -->
     <div>{{ UpperCaseName }}</div>
  </div>
</template>

<script>
import { mapMutations, mapState, mapActions, mapGetters } from 'vuex'

export default {
  name: 'Son1Com',
  methods: {
    handleAdd (n) {
      // 错误写法（Vue默认不会监测，监测需要成本）
      // this.$store.state.count++
      // 应该通过 mutation核心概念，进行修改数据
      // 需要提交调用 mutation
      // this.$store.commit('addCount')
      this.$store.commit('addCount', n)
    },
    // mapMutations和 mapActions都是映射方法（全局映射）
    ...mapMutations(['addCount']),
    ...mapActions(['updateCountAction']),

    // 分模块的映射
    ...mapMutations('user', ['updateInfo']),
    ...mapMutations('setting', ['updateTheme']),

    ...mapActions('setting', ['updateThemeSecond'])
  },
  computed: {
    // mapState和 mapGetters都是映射属性
    ...mapState(['count', 'user', 'setting']),
    // 子模块映射
    ...mapState('user', ['userInfo']),
    ...mapState('setting', ['theme', 'desc']),

    ...mapGetters(['filterList']),
    // 子模块映射
    ...mapGetters('user', ['UpperCaseName'])
  }
}
</script>

<style lang="css" scoped>
.box{
  border: 3px solid #ccc;
  width: 400px;
  padding: 10px;
  margin: 20px;
}
h2 {
  margin-top: 10px;
}
</style>
