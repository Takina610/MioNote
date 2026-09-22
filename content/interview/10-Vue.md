# v-show 和 v-if 有什么区别

v-if 是真正的条件渲染，当值为 false 时，当前元素和其子元素都会被真正销毁，被完全移除 DOM；
v-show 则不会被移除 DOM，而是简单地将 CSS `display` 属性修改为 none。

# Vue Router 中如何获取路由传递过来的参数？

1. 在组件中可以使用 `$route` 获取，使用 `$route.params` 获取路径参数，例如 `/users/1`；使用 `$route.query` 获取查询字符串，例如 `/users?id=1`；使用 `$route.hash` 获取哈希值，例如 `/users#1`
2. 使用组合式 API 的 `userRoute` 钩子函数：
```js
const route = useRoute()
console.log(route.params.id) // 获取路径参数
console.log(route.query.keyword) // 获取查询参数
console.log(route.hash) // 获取 hash 值
```

# 说一下 Vue 中的 slot

slot 是组件中的一个占位符，它允许使用该组件的父组件插入任何动态内容，使组件更有扩展性。

# 什么是 Vue 的单向数据流和双向数据流

单向数据流就是当父组件的数据传递到子组件时，子组件不能对该数据进行任何修改操作；

双向数据流就是通过 v-model 绑定的元素，是视图和数据间的绑定，当数据改变时视图改变，当用户操作视图时，数据也会改变。

# Vue 中 created 和 mounted 生命周期钩子有什么区别

created 在组件创建完成后立刻调用，此时响应式数据等发方法都已经准备就绪，但是组件还没有挂载到 DOM 上；

mounted 则在组件挂载到 DOM 上后才执行，此时可以访问组件的 DOM 节点。

# 什么是 Vue 的 v-model

v-model 是 Vue 的一个指令，用于表单元素和数据的双向数据绑定，它是一个语法糖，是 `:value` 和 `@input` 的缩写

# Vue 父子组件之间传值有哪些方式

1. 父传子可以通过 `props` 进行传递
2. 子传父可以通过 `emits` 进行传递
3. 多组件可以通过 `provide` 和 `inject` 进行传递
4. 父组件还可以通过 `ref` 属性直接访问子组件的方法和属性
5. 还可以通过第三方的事件总线库，比如 `mitt` 进行传递
6. 以及通过状态管理工具，pinia 或者 vuex

# 怎么使 CSS 样式只在当前 Vue 组件中生效

在组件的 `style` 标签上加上 `scoped` 就可以

# Vue 中 computed 和 watch 的区别是什么

computed 用于监听一个数据的变化，然后执行对应的逻辑，返回一个新值；

watch 也是监听一个数据，但是可以执行更加复杂的逻辑，适合异步操作和复杂业务。

# Vue 的 nextTick 有什么作用

nextTick 是 Vue 提供的一个全局 API，用于在 DOM 更新完成后异步执行里边的逻辑；比如获取到数据且 DOM 更新完后，执行修改滚动条的逻辑。

# 在 Vue 的 v-for 循环中，key 有什么作用

用于标识 v-for 中每个节点的唯一性，便于 Vue 快速地跟踪每个节点，也可以快速地根据 key 值来排序节点。

# 通常在 Vue 的哪个生命周期钩子中请求异步数据

在 mounted 请求，此时组件已经创建且 DOM 也渲染完成，用户可以看到页面，再请求异步数据不会阻塞组件的初始渲染。

