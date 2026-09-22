# Vuex

[vuex](https://vuex.vuejs.org/zh/)是一个 vue 的 **状态管理工具**，状态就是数据。

## 是什么

大白话：vuex 是一个插件，可以帮我们管**理 vue 通用的数据 (多组件共享的数据)**

## 场景

- 某个状态 在 **很多个组件** 来使用 (个人信息)
- 多个组件 **共同维护** 一份数据 (购物车)

## 优势

- 共同维护一份数据，**数据集中化管理**
- **响应式变化**
- 操作简洁 (vuex提供了一些辅助函数)

## 使用

**安装**

```bash
npm install vuex@3
```

**新建 `store/index.js` 专门存放 vuex**

**Vue.use(Vuex)**

**创建仓库 new Vuex.Store()**

```js
// 这里存放的是 vuex相关的核心代码
import Vue from 'vue'
import Vuex from 'vuex'

// 插件安装
Vue.use(Vuex)

// 创建空仓库
const store = new Vuex.Store({})

export default store
```

**在 `main.js` 中导入挂载到 Vue 实例上**

```js
import store from './store/index'

new Vue({
  render: h => h(App),
  store
}).$mount('#app')
```

## state 状态

明确如何给仓库 **提供** 数据，如何 **使用** 仓库的数据

**提供数据**：

- State 提供唯一的公共数据源，所有共享的数据都要统一放到 Store 中的 State 中存储。
- 在 state 对象中可以添加我们要共享的数据。

```js
// 创建仓库
const store = new Vuex.Store({
  // state 状态，即数据，类似于 vue 组件中的 data
  // 区别：
  // 1. data 是组件自己的数据
  // 2. state 是所有组件共享的数据
  state: {
    count: 101
  }
})
```

### 使用数据

#### 通过 store 直接访问

```js
获取 store：
(1) this.$store
(2) import 导入 store

模板中： {{ $store.state.xxx }}
组件逻辑中： this.$store.state.xxx
JS模块中： store.state.xxx
```

```js
{{ count }}

// 把state中数据，定义在组件内的计算属性中
computed: {
  count () {
    return this.$store.state.count
  }
},
```

#### 通过辅助函数 (简化)

`mapState` 是辅助函数，帮助我们把 store 中的数据 **自动** 映射到 组件的计算属性中

```js
import { mapState } from 'vuex'

mapState(['count'])

// 组件中
computed: {
 ...mapState(['count','title'])
}
```

## mutations

**目标**：明确 vuex 同样遵循单向数据流，组件中不能直接修改仓库的数据

通过 `strict: true` 可以开启严格模式

```js
// 创建空仓库
const store = new Vuex.Store({
  // 严格模式 （有利初学者，检测不规范的代码，上线时需要移除）
  strict: true,
  // 1. 通过 state可以提供数据（所有组件共享的数据）
  state: {
    title: '大标题',
    count: 100,
  },
})

this.$store.state.count++ (错误写法)
```

### 使用

**定义 mutations 对象，对象中存放修改 state 的方法**

```js
const store = new Vuex.Store({
  state: {
    count: 0
  },
  // 定义mutations
  mutations: {
    // 第一个参数是当前store的state属性
    addCount (state) {
      state.count += 1
    }
  }
})
```

**组件中提交调用 mutations**

```js
this.$store.commit('addCount')
```

**提交 mutation 是可以传递参数的** `this.$store.commit( 'xxx', 参数 )`

```js
mutations: {
  ...
  addCount (state, n) {
    state.count += n
  }
},
```

**页面中提交调用 mutation**

```js
this.$store.commit('addCount', 10)
```

**提交参数只能一个，如果有多个参数，包装成一个对象传递**

```js
this.$store.commit('addCount', {
  count: 10
})
```

### 辅助函数

`mapMutations` 和 `mapState` 很像，它是把位于 **mutations 中的方法**提取了出来，映射到**组件 methods** 中

```js
mutations: {
  subCount (state, n) {
    state.count -= n
  },
}
```

```js
import { mapMutations } from 'vuex'

methods: {
  ...mapMutations(['subCount'])
}
```

```js
this.subCount(10) // 调用
```

**如果不使用 mapMutations，可以直接在 methods 中定义**

```js
methods: {
  subCount (n) {
    this.$store.commit('subCount', n)
  },
}
```

## actions

明确 actions 的基本语法，处理异步操作。

需求: 一秒钟之后, 修改 state 的 count 成 666。

说明：**mutations 必须是同步的 (便于监测数据变化，记录调试)**

### 使用

**提供action 方法**

```js
actions: {
  setAsyncCount (context, num) {
    // 一秒后, 给一个数, 去修改 num
    setTimeout(() => {
      context.commit('changeCount', num)
    }, 1000)
}
}
```

**页面中 dispatch 调用**

```js
this.$store.dispatch('setAsyncCount', 200)
```

### 辅助函数

**mapActions 是把位于 actions中的方法提取了出来，映射到组件methods中**

```js
actions: {
  changeCountAction (context, num) {
    setTimeout(() => {
      context.commit('changeCount', num)
    }, 1000)
  }
}
```

```js
import { mapActions } from 'vuex'

methods: {
  ...mapActions(['changeCountAction'])
}
```

```js
this.changeCountAction(666) // 调用
```

**如果不使用 mapActions，可以直接在 methods 中定义**

```js
methods: {
  changeCountAction (n) {
    this.$store.dispatch('changeCountAction', n)
  },
}
```

## getters

目标：掌握核心概念 getters 的基本语法 (类似于计算属性)

说明：除了 `state` 之外，有时我们还需要从 `state` 中**派生出一些状态**，这些状态是依赖 `state` 的，此时会用到 `getters`

例如：`state` 中定义了 `list`，为 1-10 的数组，组件中，需要显示所有大于 5 的数据

```js
state: {
  list: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
}
```

**定义 getters**

```js
getters: {
  // 注意：
  // (1) getters函数的第一个参数是 state
  // (2) getters函数必须要有返回值
  filterList (state) {
    return state.list.filter(item => item > 5)
  }
}
```

**访问getters**

```js
{{ $store.getters.filterList }}
```

**mapGetters**

```js
computed: {
  ...mapGetters(['filterList'])
},

{{ filterList }}
```

## 模块 module

由于 vuex 使用**单一状态树**，应用的所有状态**会集中到一个比较大的对象**。当应用变得非常复杂时，

store 对象就有可能变得相当臃肿。(当项目变得越来越大的时候，Vuex会变得越来越难以维护)

![](./assets/Snipaste_2025-05-29_12-43-31.png)

### 模块拆分

**user模块: `store/modules/user.js`**

```js
// user模块
const state = {
  userInfo: {
    name: 'zs',
    age: 18
  }
}
const mutations = {}
const actions = {}
const getters = {}

export default {
  state,
  mutations,
  actions,
  getters
}
```

**在 `store/index.js` 中注册模块**

```js
import user from './modules/user'

const store = new Vuex.Store({
  modules: {
    user
  }
})
```

尽管已经分模块了，但其实子模块的状态，还是会挂到根级别的 state 中，属性名就是模块名

#### 使用模块中的 state

直接通过模块名访问 `$store.state.模块名.xxx`

通过 `mapState` 映射

默认根级别的映射 `mapState([ 'xxx' ])`

子模块的映射 `mapState('模块名', ['xxx'])` - **需要开启命名空间**

```js
export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
```

#### 使用模块中 getters 中的数据

直接通过模块名访问 `$store.getters['模块名/xxx ']`

通过 `mapGetters` 映射

默认根级别的映射 `mapGetters([ 'xxx' ])`

子模块的映射 `mapGetters('模块名', ['xxx'])` - **需要开启命名空间**

#### 使用模块中的 mutations 中的方法

默认模块中的 mutation 和 actions 会被挂载到全局，需要开启命名空间，才会挂载到子模块

#### 调用子模块中 mutation

直接通过 store 调用 `$store.commit('模块名/xxx ', 额外参数)`

通过 `mapMutations` 映射

默认根级别的映射 `mapMutations([ 'xxx' ])`
子模块的映射 `mapMutations('模块名', ['xxx'])` - **需要开启命名空间**

#### 调用子模块中 action

直接通过 store 调用 `$store.dispatch('模块名/xxx ', 额外参数)`

通过 `mapActions` 映射

默认根级别的映射 `mapActions([ 'xxx' ])`

子模块的映射 `mapActions('模块名', ['xxx'])` - **需要开启命名空间**

# 路由守卫

**基于全局前置守卫，进行页面访问拦截处理**

路由导航守卫 - [全局前置守卫](https://v3.router.vuejs.org/zh/guide/advanced/navigation-guards.html#%E5%85%A8%E5%B1%80%E5%89%8D%E7%BD%AE%E5%AE%88%E5%8D%AB)

- 所有的路由一旦被匹配到，都会先经过全局前置守卫。

- 只有全局前置守卫放行，才会真正解析渲染组件，才能看到页面内容。访问权限页面时，拦截或放行的关键点？→ **用户是否有登录权证 token**

![](./assets/Snipaste_2025-05-30_12-21-22.png)

```js
router.beforeEach((to, from, next) => {
  // 1. to   往哪里去，到哪去的路由信息对象
  // 2. from 从哪里来，从哪来的路由信息对象
  // 3. next() 是否放行
  //    如果 next() 调用，就是放行
  //    next(路径) 拦截到某个路径页面
})
```