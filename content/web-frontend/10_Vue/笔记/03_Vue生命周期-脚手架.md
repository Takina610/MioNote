# 生命周期

思考：什么时候可以发送初始化渲染请求？（越早越好） 什么时候可以开始操作dom？（至少dom得渲染出来）

**Vue生命周期：** 一个Vue实例从 创建 到 销毁 的整个过程。

**生命周期四个阶段：** ① 创建 ② 挂载 ③ 更新 ④ 销毁

![](./assets/Snipaste_2025-05-25_10-00-40.png)

## 生命周期函数（钩子函数）

Vue生命周期过程中，会自动运行一些函数，被称为【生命周期钩子】→ 让开发者可以在【特定阶段】运行自己的代码。

![](./assets/Snipaste_2025-05-25_10-02-04.png)

**生命周期函数列表：**

- `beforeCreate`：实例创建之前，数据观测和事件配置之前。
- `created`：实例创建之后，数据观测和事件配置之后。
- `beforeMount`：实例挂载之前。
- `mounted`：实例挂载之后。
- `beforeUpdate`：数据更新之前。
- `updated`：数据更新之后。
- `beforeDestroy`：实例销毁之前。
- `destroyed`：实例销毁之后。

![](./assets/Snipaste_2025-05-25_10-03-06.png)

```html
<div id="app">
  <h3>{{ title }}</h3>
  <div>
    <button @click="count--">-</button>
    <span>{{ count }}</span>
    <button @click="count++">+</button>
  </div>
</div>

<script>
  const app = new Vue({
    el: '#app',
    data: {
      count: 100,
      title: '计数器'
    },
    beforeCreate() {
      console.log("beforeCreated 响应式数据准备好之前", this.count)
    },
    created() {
      console.log("created 响应式数据准备好之后", this.count)
    },
    beforeMount() {
      console.log("beforeMount 模板渲染之前", document.querySelector('h3').innerHTML)
    },
    mounted() {
      console.log("mounted 模板渲染之后", document.querySelector('h3').innerHTML)
      // 可以开始操作 dom了
    },
    beforeUpdate() {
      console.log("beforeUpdate 数据修改了，视图还没更新", document.querySelector('span').innerHTML)
    },
    updated() {
      console.log("updated 数据修改了，视图已经更新", document.querySelector('span').innerHTML)
    },
    beforeDestroy() {
      console.log("beforeDestroy 卸载前")
      console.log("清除掉一些 Vue以外的资源占用，定时器，延时器")
    },
    destroyed() {
      console.log("destroy 卸载后")
    }
  })
</script>
```

**created应用**

```html
<script>
  const app = new Vue({
    el: '#app',
    data: {
      list: [],
    },
    async created() {
      // 发送请求，获取数据
      const res = await axios.get('http://hmajax.itheima.net/api/news')
      // 将数据更新给 data中的 list
      this.list = res.data.data
    }
  })
</script>
```

**mounted应用**

```html
<script>
  const app = new Vue({
    el: '#app',
    data: {
      words: ''
    },
    // 核心思路：
    // 1. 等输入框渲染出来 (mounted阶段)
    // 2. 让输入框获取焦点
    mounted() {
      console.log(document.querySelector('#inp'))
      document.querySelector('#inp').focus()
    }
  })
</script>
```

# 脚手架（Vue CLI）

**Vue CLI 是 Vue 官方提供的一个全局命令工具。**

可以帮助我们快速创建一个开发 Vue 项目的标准化基础架子。【集成了 webpack 配置】

**特点：**
- 开箱即用，零配置
- 内置 babel 等工具
- 标准化

**使用步骤：**
1. 全局安装 (一次) ：yarn global add @vue/cli 或 npm i @vue/cli -g
2. 查看 Vue 版本：vue --version
3. 创建项目架子：vue create project-name（项目名-不能用中文）
4. 启动项目： yarn serve 或 npm run serve（找package.json）

**脚手架目录文件**

![](./assets/Snipaste_2025-05-25_10-12-53.png)

![](./assets/Snipaste_2025-05-25_10-15-00.png)

## 组件化开发

- **组件化**：一个页面可以拆分成**一个个组件**，每个组件有着自己独立的**结构**、**样式**、**行为**。
**好处**：便于**维护**，利于**复用** → 提升**开发效率**。
**组件分类**：普通组件、根组件。

- **根组件**：整个应用最上层的组件，包裹所有普通小组件

**App.vue 文件（单文件组件）的三个组成部分**

安装语法高亮插件：`Vetur`

**三部分：**
- `template`：结构 （有且只能一个根元素）
- `script`: `js`逻辑
- `style`： 样式 (可支持`less`，需要装包)

**让组件支持 `less` 语法：**
- `style`标签，`lang="less"` 开启less功能
- 装包: `yarn add less less-loader`

```html
<template>
  <div class="box">
    {{msg}} <button @click="fn">点我</button>
  </div>
</template>

<script>
export default {
  name: 'Box',
  data() {
    return {
      msg: '我是一个盒子'
    }
  },
  methods: {
    fn() {
      alert('Hello Vue!')
    }
  }
}
</script>

<style lang="less">
.box {
  color: red;
  .btn {
     background-color: blue;
   }
}
</style>
```

## 注册组件

### 局部注册

**局部注册**：只能在注册的组件内使用

① 创建 .vue 文件 (三个组成部分)
② 在使用的组件内导入并注册

在 `components` 目录下创建组件：`HmHeader.vue`，组件名命名需遵守大驼峰命名法。

在 `App.vue` 文件中导入并注册组件：

```js
// 导入需要注册的组件
import 组件对象 from '.vue文件路径'
import HmHeader from './components/HmHeader'

export default {
  // 局部注册
  components: {
    '组件名': 组件对象,
    HmHeader
  }
}
```

使用：当成 `html` 标签使用 `<组件名></组件名>`

### 全局注册

**全局注册**：所有组件内都能使用

① 创建 .vue 文件 (三个组成部分)
② main.js 中进行全局注册

在 `components` 目录下创建组件：`HmHeader.vue`，组件名命名需遵守大驼峰命名法。

在 `main.js` 文件中进行全局注册：

```js
// 导入需要注册的组件
import 组件对象 from '.vue文件路径'
import HmHeader from './components/HmHeader'

// 全局注册
Vue.component('组件名', 组件对象)
Vue.component('HmHeader', HmHeader)
```

使用：当成 `html` 标签使用 `<组件名></组件名>`