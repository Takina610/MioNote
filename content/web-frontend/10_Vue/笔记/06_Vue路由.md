# 单页应用程序

**单页应用程序，即 Single-Page Application，简称 SPA**，是一种使用 JavaScript、HTML 和 CSS 构建的 Web 应用程序。SPA 的核心是前端路由，它使得用户在访问网站时，**只需加载一次页面**，然后通过前端路由来切换页面，而不需要重新加载整个页面。==所有功能在 **一个 html 页面** 上实现==

![](./assets/Snipaste_2025-05-28_10-27-31.png)

单页面应用程序，之所以开发效率高，性能高，用户体验好

最大的原因就是：**页面按需更新**

要按需更新，首先就需要明确：**访问路径** 和 **组件** 的对应关系！

访问路径 和 组件的对应关系如何确定呢？ **路由**

# 路由

生活中的路由：设备和 ip 的**映射**关系

比如路由器通过源 ip 和目的 ip 确定数据包的下一跳。

Vue中路由：**路径** 和 **组件** 的 **映射** 关系

![](./assets/Snipaste_2025-05-28_10-30-27.png)

## VueRouter

目标：认识插件 VueRouter，掌握 VueRouter 的基本使用步骤

作用：**修改**地址栏路径时，**切换显示**匹配的**组件**

说明：Vue 官方的一个路由插件，是一个第三方包

官网：https://v3.router.vuejs.org/zh/

## VueRouter 的 使用 (5 + 2)

### 5个基础步骤 (固定)

1. 下载： 下载 VueRouter 模块到当前工程

```bash
npm install vue-router
```

2. 创建 `./router/index.js` 文件，引入 VueRouter 模块

```js
import VueRouter from 'vue-router'
```

3. 安装注册

```js
Vue.use(VueRouter)
```

4. 创建路由对象

```js
const router = new VueRouter()
```

5. 注入，将路由对象注入到 new Vue 实例（`main.js`）中，建立关联

```js
import router from './router/index'

new Vue({
  render: h => h(App),
  router
}).$mount('#app')
```

### 2 个核心步骤

1. 创建需要的组件 (views目录)，配置路由规则

这里创建 `Find.vue` `My.vue` `Friend.vue` 三个组件 (在 `./views` 目录下)

2. 配置路由规则，在 ./router/index.js 文件中配置路由规则

```js
import Find from './views/Find'
import My from './views/My'
import Friend from './views/Friend'

// 创建了一个路由对象
const router = new VueRouter({
  // routes 路由规则们
  // route  一条路由规则 { path: 路径, component: 组件 }
  routes: [
    { path: '/find', component: Find },
    { path: '/my', component: My },
    { path: '/friend', component: Friend },
  ]
})

export default router
```

3. 配置导航，配置路由出口(路径匹配的组件显示的位置)，在 `App.vue` 文件中配置导航

```html
<template>
  <div>
    <div class="footer_wrap">
      <a href="#/find">发现音乐</a>
      <a href="#/my">我的音乐</a>
      <a href="#/friend">朋友</a>
    </div>
    <div class="top">
      <!-- 路由出口 → 匹配的组件所展示的位置 -->
      <router-view></router-view>
    </div>
  </div>
</template>
```

### 组件存放目录问题

==注意==：**.vue文件** 本质无区别。
路由相关的组件，为什么放在 views 目录呢？**组件分类**

**组件分类**： .vue文件分2类： **页面组件** & **复用组件**

分类开来 **更易维护**
- `src/views` 文件夹
  - **页面组件** - 页面展示 - 配合路由用
- `src/components` 文件夹
  - **复用组件** - 展示数据 - 常用于复用

## 声明式导航

### 导航链接
需求：实现导航高亮效果

vue-router 提供了一个全局组件 `router-link` (取代 `a` 标签)
- **能跳转**，配置 `to` 属性指定路径(**必须**) 。本质还是 `a` 标签 ，**to 无需 `#`**
- **能高亮**，默认就会提供**高亮类名**，可以直接设置高亮样式

```html
<!-- 原来的 -->
<a href="#/find">发现音乐</a>
<a href="#/my">我的音乐</a>
<a href="#/friend">朋友</a>

<!-- 改成 -->
<router-link to="/find">发现音乐</router-link>
<router-link to="/my">我的音乐</router-link>
<router-link to="/friend">朋友</router-link>
```

### 精准匹配 & 模糊匹配

说明：我们发现 `router-link` 自动给当前导航添加了 **两个高亮类名**

![](./assets/Snipaste_2025-05-28_10-46-12.png)

- `router-link-active`：**模糊匹配 (用的多)**
  - `to="/my"` 可以匹配 `/my` `/my/a` `/my/b` ....

- `router-link-exact-active`：**精确匹配**
  - `to="/my`" 仅可以匹配 `/my`

### 自定义高亮类名

说明：`router-link` 的 **两个高亮类名太长了**，我们希望能定制怎么办？

语法：

```js
const router = new VueRouter({
  routes: [...],
  linkActiveClass: "类名1", // 模糊匹配
  linkExactActiveClass: "类名2" // 精确匹配
})
```

![](./assets/Snipaste_2025-05-28_10-48-25.png)

### 跳转传参

目标：在跳转路由时, 进行传值

#### 查询参数传参

语法格式如下：

- `to="/path?参数名=值"`
- 对应页面组件接收传递过来的值
  - `$route.query.参数名`

**App.vue**

```html
<template>
  <div id="app">
    <div class="link">
      <router-link to="/home">首页</router-link>
      <router-link to="/search">搜索页</router-link>
    </div>

    <router-view></router-view>
  </div>
</template>
```

**router/index.js**

```js
const router = new VueRouter({
  routes: [
    { path: '/home', component: Home },
    { path: '/search', component: Search }
  ]
})
```

**Home.vue**

```html
<div class="hot-link">
  热门搜索：
  <router-link to="/search?key=程序员">程序员</router-link>
  <router-link to="/search?ke=前端培训">前端培训</router-link>
  <router-link to="/search?key=如何成为前端大牛">如何成为前端大牛</router-link>
</div>
```

**Search.vue**

```html
<template>
  <div class="search">
    <p>搜索关键字: {{ $route.query.key }} </p>
    <p>搜索结果: </p>
    <ul>
      <li>.............</li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'MyFriend',
  created () {
    // 在created中，获取路由参数
    // this.$route.query.参数名 获取
    console.log(this.$route.query.key)
  }
}
</script>
```

#### 动态路由传参

1. 配置动态路由，在 `./router/index.js` 文件中配置路由规则

```js
const router = new VueRouter({
  routes: [
    { path: '/home', component: Home },
    { path: '/search/:words', component: Search }
  ]
})
```

2. 配置导航链接：`to="/path/参数值"`

3. 对应页面组件接收传递过来的值：`$route.params.参数名`

**App.vue**

```html
<template>
  <div id="app">
    <div class="link">
      <router-link to="/home">首页</router-link>
      <router-link to="/search">搜索页</router-link>
    </div>
    <router-view></router-view>
  </div>
</template>
```

**Home.vue**

```html
<div class="hot-link">
  热门搜索：
  <router-link to="/search/程序员">程序员</router-link>
  <router-link to="/search/前端培训">前端培训</router-link>
  <router-link to="/search/如何成为前端大牛">如何成为前端大牛</router-link>
</div>
```

**Search.vue**

```html
<template>
  <div class="search">
    <p>搜索关键字: {{ $route.params.words }} </p>
    <p>搜索结果: </p>
    <ul>
      <li>.............</li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'MyFriend',
  created () {
    // 在created中，获取路由参数
    // this.$route.query.参数名 获取查询参数
    // this.$route.params.参数名 获取动态路由参数
    console.log(this.$route.params.words);
  }
}
</script>
```

##### 动态路由参数可选符

问题：配了路由 `path: "/search/:words"` 为什么按下面步骤操作，会未匹配到组件，显示空白？

原因： `/search/:words` 表示，**必须要传参数**。如果不传参数，也希望匹配，可以加个可选符 `"?"`。

```js
{ path: '/search/:words?', component: Search }
```

#### 两种传参方式的区别

查询参数传参 (比较适合传**多个参数**)
- 跳转：`to="/path?参数名=值&参数名2=值"`
- 获取：`$route.query.参数名`

动态路由传参 (**优雅简洁**，传单个参数比较方便)
- 配置动态路由：`path: "/path/:参数名"`
- 跳转：`to="/path/参数值"`
- 获取：`$route.params.参数名`

## 路由重定向

问题：网页打开， url 默认是 / 路径，未匹配到组件时，会出现空白

说明：重定向 → 匹配path后, 强制跳转path路径

**语法**： `{ path: 匹配路径, redirect: 重定向到的路径 }`,

```js
const router = new VueRouter({
  routes: [
    { path: '/', redirect: '/home' }, // 重定向到 /home
    { path: '/home', component: Home },
    { path: '/search/:words?', component: Search }
  ]
})
```

## 404

作用：当路径找不到匹配时，给个提示页面

位置：配在路由最后

语法：`path: "*"` (任意路径) – 前面不匹配就命中最后这个

```js
const router = new VueRouter({
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/home', component: Home },
    { path: '/search/:words?', component: Search },
    { path: '*', component: NotFound }
  ]
})
```

## 模式设置

问题: 路由的路径看起来不自然，有`#`，能否切成真正路径形式？

- **hash路由**(默认) 例如: http://localhost:8080/#/home

```js
const router = new VueRouter({
  mode: 'hash',
  routes: [...]
})
```

- **history路由**(常用) 例如: http://localhost:8080/home

```js
const router = new VueRouter({
  mode: 'history',
  routes: [...]
})
```

## 编程式导航

### 基本跳转

问题：点击按钮跳转如何实现？

编程式导航：用 `JS` 代码来进行跳转

两种语法：

- path 路径跳转（**简易方便**）

```js
this.$router.push('路由路径')

this.$router.push({
  path: '路由路径'
})
```

- name 命名路由跳转（**适合 path 路径长的场景**）

```js
this.$router.push({
  name: '路由名'
})
```

```js
const router = new VueRouter({
  routes: [
    { name: '路由名', path: '/path/xxx', component: XXX },
  ]
})
```

**Home.vue**

```html
<template>
  <div class="home">
    <div class="logo-box"></div>
    <div class="search-box">
      <input type="text">
      <button @click="goSearch">搜索一下</button>
    </div>
    <div class="hot-link">
      热门搜索：
      <router-link to="/search/程序员">程序员</router-link>
      <router-link to="/search/前端培训">前端培训</router-link>
      <router-link to="/search/如何成为前端大牛">如何成为前端大牛</router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FindMusic',
  methods: {
    goSearch () {
      // 1. 通过路径的方式跳转
      // (1) this.$router.push('路由路径') [简写]
      // this.$router.push('/search')

      // (2) this.$router.push({     [完整写法]
      //         path: '路由路径' 
      //     })
      // this.$router.push({
      //   path: '/search'
      // })

      // 2. 通过命名路由的方式跳转 (需要给路由起名字) 适合长路径
      //    this.$router.push({
      //        name: '路由名'
      //    })
      this.$router.push({
        name: 'search'
      })
    }
  }
}
</script>
```

### 路由传参

问题：点击搜索按钮，跳转需要传参如何实现？

两种传参方式：查询参数 + 动态路由传参

**两种跳转方式，对于两种传参方式都支持：**

- path 路径跳转传参(**query传参**)

```js
this.$router.push('/路径?参数名1=参数值1&参数2=参数值2')

this.$router.push({
  path: '/路径',
  query: {
    参数名1: '参数值1',
    参数名2: '参数值2'
  }
})
```

- path 路径跳转传参 (**动态路由传参**)

```js
this.$router.push('/路径/参数值')

this.$router.push({
  path: '/路径/参数值'
})
```

- name 命名路由跳转传参(**query传参**)

```js
this.$router.push({
  name: '路由名字',
  query: {
    参数名1: '参数值1',
    参数名2: '参数值2'
  }
})
```

- name 命名路由跳转传参 (**动态路由传参**)

```js
this.$router.push({
  name: '路由名字',
  params: {
    参数名: '参数值'
  }
})
```

**Home.vue**

```html
<template>
  <div class="home">
    <div class="logo-box"></div>
    <div class="search-box">
      <input v-model="inpValue" type="text">
      <button @click="goSearch">搜索一下</button>
    </div>
    <div class="hot-link">
      热门搜索：
      <router-link to="/search/黑马程序员">黑马程序员</router-link>
      <router-link to="/search/前端培训">前端培训</router-link>
      <router-link to="/search/如何成为前端大牛">如何成为前端大牛</router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FindMusic',
  data () {
    return {
      inpValue: ''
    }
  },
  methods: {
    goSearch () {
      // 1. 通过路径的方式跳转
      // (1) this.$router.push('路由路径') [简写]
      //     this.$router.push('路由路径?参数名=参数值')
      // this.$router.push('/search')
      // this.$router.push(`/search?key=${this.inpValue}`)
      // this.$router.push(`/search/${this.inpValue}`)

      // (2) this.$router.push({     [完整写法] 更适合传参
      //         path: '路由路径'
      //         query: {
      //            参数名: 参数值,
      //            参数名: 参数值
      //         }
      //     })
      // this.$router.push({
      //   path: '/search',
      //   query: {
      //     key: this.inpValue
      //   }
      // })
      // this.$router.push({
      //   path: `/search/${this.inpValue}`
      // })



      // 2. 通过命名路由的方式跳转 (需要给路由起名字) 适合长路径
      //    this.$router.push({
      //        name: '路由名'
      //        query: { 参数名: 参数值 },
      //        params: { 参数名: 参数值 }
      //    })
      this.$router.push({
        name: 'search',
        // query: {
        //   key: this.inpValue
        // }
        params: {
          words: this.inpValue
        }
      })
    }
  }
}
</script>
```

## 组件缓存 keep-alive

问题：从面经 点到 详情页，又点返回，数据重新加载了 → 希望回到原来的位置

原因：路由跳转后，组件被销毁了，返回回来组件又被重建了，所以数据重新被加载了

**解决：利用 `keep-alive` 将组件缓存下来**

### keep-alive 是什么

- `keep-alive` 是 Vue 的内置组件，当它包裹动态组件时，会缓存不活动的组件实例，而不是销毁它们。
- `keep-alive` 是一个抽象组件：它自身不会渲染成一个 DOM 元素，也不会出现在父组件链中。

### keep-alive 的优点

- 在组件切换过程中 把切换出去的组件保留在内存中，**防止重复渲染 DOM**，
- 减少加载时间及性能消耗，提高用户体验性。

```html
<template>
  <div class="h5-wrapper">
    <keep-alive>
      <router-view></router-view>
    </keep-alive>
  </div>
</template>
```

### keep-alive 的三个属性

- include ： 组件名数组，只有匹配的组件会被缓存
- exclude ： 组件名数组，任何匹配的组件都不会被缓存
- max ： 最多可以缓存多少组件实例

```html
<template>
  <div class="h5-wrapper" :include="['LayoutPage']">
    <keep-alive >
      <router-view></router-view>
    </keep-alive>
  </div>
</template>
```

### keep-alive 的使用会触发两个生命周期函数

- `activated` 当组件**被激活（使用）**的时候触发 → 进入这个页面的时候触发
- `deactivated` 当组件**不被使用**的时候触发 → 离开这个页面的时候触发

**组件缓存后就不会执行组件的`created`, `mounted`, `destroyed` 等钩子了**

所以其提供了 `actived` 和 `deactived` 钩子，帮我们实现业务需求

```js
activated () {
  console.log('actived 激活 → 进入页面');
},
deactivated() {
  console.log('deactived 失活 → 离开页面');
} 
```

# 自定义创建项目

目标：基于 VueCli 自定义创建项目架子

![](./assets/Snipaste_2025-05-28_11-25-48.png)