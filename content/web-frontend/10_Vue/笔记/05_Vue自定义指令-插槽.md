# 自定义指令

自定义指令：自己定义的指令, 可以**封装一些 dom 操作**， 扩展额外功能。

## 全局注册

语法：

```js
Vue.directive('指令名', {
  "inserted" (el) {
    // 可以对 el 标签，扩展额外功能
    el.focus()
  }
})
```

## 局部注册

语法：

```js
directives: {
  "指令名": {
    inserted () {
      // 可以对 el 标签，扩展额外功能
      el.focus()
    }
  }
}
```

**需求: 当页面加载时，让元素将获得焦点**

```html
<template>
  <div>
    <h1>自定义指令</h1>
    <input v-focus ref="inp" type="text">
  </div>
</template>

<script>
export default {
  // mounted () {
  //   this.$refs.inp.focus()
  // }

  // 2.局部注册指令
  directives: {
    // 指令名：指令的配置项
    focus: {
      inserted (el) {
        el.focus()
      }
    }
  }
}
</script>

<style>
</style>
```

**或者全局注册**

main.js

```js
import Vue from 'vue'
import App from './App.vue'

Vue.config.productionTip = false

// 1.全局注册指令
Vue.directive('focus', {
  // inserted会在指令所在的元素，被插入到页面中时触发
  inserted (el) {
    // el就是指令所绑定的元素
    el.focus()
  }
})

new Vue({
  render: h => h(App),
}).$mount('#app')
```

## 指令的值

**需求：实现一个 color 指令 - 传入不同的颜色, 给标签设置文字颜色**

```html
<template>
  <div>
    <h1 v-color="color1">指令的值1测试</h1>
    <h1 v-color="color2">指令的值2测试</h1>
  </div>
</template>

<script>
export default {
  data () {
    return {
      color1: 'purple',
      color2: 'red'
    }
  },
  directives: {
    color: {
      // inserted提供的时元素被添加到页面中时的逻辑
      inserted (el, binding) {
        el.style.color = binding.value
      },
      // update提供的是指令的值修改的时候触发
      update (el, binding) {
        el.style.color = binding.value
      }
    }
  }
}
</script>

<style>
</style>
```

## v-loading 指令封装

**需求：实现一个 v-loading 指令，可以给元素添加一个 loading 效果**

```html
<template>
  <div class="main">
    <div class="box" v-loading="isLoading">
      <ul>
        <li v-for="item in list" :key="item.id" class="news">
          <div class="left">
            <div class="title">{{ item.title }}</div>
            <div class="info">
              <span>{{ item.source }}</span>
              <span>{{ item.time }}</span>
            </div>
          </div>

          <div class="right">
            <img :src="item.img" alt="">
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
// 安装 axios =>  yarn add axios
import axios from 'axios'

// 接口地址：http://hmajax.itheima.net/api/news
// 请求方式：get
export default {
  data () {
    return {
      list: [],
      isLoading: true
    }
  },
  async created () {
    // 1. 发送请求获取数据
    const res = await axios.get('http://hmajax.itheima.net/api/news')
    
    setTimeout(() => {
      // 2. 更新到 list 中
      this.list = res.data.data
      this.isLoading = false
    }, 2000)
  },
  directives: {
    loading: {
      inserted (el, binding) {
        binding.value ? el.classList.add('loading') : el.classList.remove('loading')
      },
      update (el, binding) {
        binding.value ? el.classList.add('loading') : el.classList.remove('loading')
      }
    }
  }
}
</script>

<style>
</style>
```

- **inserted** 钩子中，`binding.value` 判断指令的值，**设置默认状态**
- **update** 钩子中，`binding.value` 判断指令的值，**更新类名状态**

# 插槽

## 默认插槽

**作用**：让组件内部的一些 **结构** 支持 **自定义**

**需求**: 将需要多次显示的对话框，封装成一个组件

**问题**：组件的内容部分，**不希望写死**，希望能使用的时候**自定义**。怎么办？

![](./assets/Snipaste_2025-05-27_12-35-02.png)

**插槽基本语法：**
- 组件内需要定制的结构部分，改用 `<slot></slot>` 占位
- 使用组件时，`<MyDialog></MyDialog>` 标签内部, 传入结构替换 slot

**App.vue**

```html
<template>
  <div>
    <!-- 在使用组件时，组件标签内插入内容 -->
    <MyDialog>
      你确认要删除吗
      <div>你确认要删除吗</div>
    </MyDialog>
    <MyDialog>
      你确认要退出吗
      <p>你确认要退出吗</p>
    </MyDialog>
  </div>
</template>
```

**MyDialog.vue**

```html
<template>
  <div class="dialog">
    <div class="dialog-header">
      <h3>友情提示</h3>
      <span class="close">✖️</span>
    </div>

    <div class="dialog-content">
      <!-- 在需要定制的地方插入的内容 -->
      <slot></slot>
    </div>
    <div class="dialog-footer">
      <button>取消</button>
      <button>确认</button>
    </div>
  </div>
</template>
```

## 后备插槽

通过插槽完成了内容的定制，传什么显示什么, 但是如果不传，则是空白

能否给插槽设置 **默认显示内容** 呢？

![](./assets/Snipaste_2025-05-27_12-38-21.png)

插槽后备内容：封装组件时，可以为预留的 `<slot>` 插槽提供**后备内容**（默认内容）。

**语法**: 在 `<slot>` 标签内，放置内容，作为默认显示内容。

外部使用组件时，不传东西，则 slot 会显示后备内容。

```html
<MyDialog></MyDialog>
```

外部使用组件时，传东西了，则 slot 整体会被换掉

```html
<MyDialog>你确认要删除吗</MyDialog>
```

**MyDialog.vue**

```html
<template>
  <div class="dialog">
    <!-- 默认值 -->
    <slot>我是后背内容</slot>
  </div>
</template>
```

## 具名插槽

**需求**：一个组件内有多处结构，需要外部传入标签，进行定制

**默认插槽**：一个的定制位置

![](./assets/Snipaste_2025-05-27_12-41-20.png)

**具名插槽语法：**

- 多个slot使用name属性区分名字：

```html
<div class="dialog">
  <div class="dialog-header">
    <!-- 一旦插槽取了名字，就是具名插槽，只会定向分发 -->
    <slot name="head"></slot>
  </div>

  <div class="dialog-content">
    <slot name="content"></slot>
  </div>
  <div class="dialog-footer">
    <slot name="footer"></slot>
  </div>
</div>
```

- template 配合 `v-slot`：名字来分发对应标签
- `v-slot:插槽名` 可以简化成 `#插槽名`
```html
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
```

## 作用域插槽

作用域插槽: 定义 slot 插槽的同时，是可以传值的。给 **插槽** 上可以 **绑定数据**，将来 **使用组件时可以用**。

**场景**：封装表格组件

1. 父传子，动态渲染表格内容
2. 利用默认插槽，定制操作列
3. 删除或查看都需要用到 当前项的 id，属于 **组件内部的数据** 通过 **作用域插槽** 传值绑定，进而使用

![](./assets/Snipaste_2025-05-27_12-46-01.png)

基本使用步骤：

1. 给 slot 标签, 以 添加属性的方式传值

```html
<slot :id="item.id" msg="测试文本"></slot>
```

2. 所有添加的属性, 都会被收集到一个对象中

```json
{ id: 3, msg: '测试文本' }
```

在 template 中, 通过 ` #插槽名= "obj" ` 接收，默认插槽名为 **default**

```html
<MyTable :list="list">
  <template #default="obj">
    <button @click="del(obj.id)">删除</button>
  </template>
</MyTable>
```

**App.vue**

```html
<template>
  <div>
    <MyTable :data="list">
      <!-- 通过 template #插槽名="变量名" 接受传过来的数据 -->
      <template #default="obj">
        <button @click="del(obj.item.id)">删除</button>
      </template>
    </MyTable>
    <MyTable :data="list2">
      <!-- 对象解构 -->
      <template #default="{ item }">
        <button @click="view(item)">查看</button>
      </template>
    </MyTable>
  </div>
</template>

<script>
import MyTable from './components/MyTable.vue'
export default {
  data () {
    return {
      list: [
        { id: 1, name: '张小花', age: 18 },
        { id: 2, name: '孙大明', age: 19 },
        { id: 3, name: '刘德忠', age: 17 },
      ],
      list2: [
        { id: 1, name: '赵小云', age: 18 },
        { id: 2, name: '刘蓓蓓', age: 19 },
        { id: 3, name: '姜肖泰', age: 17 },
      ]
    }
  },
  components: {
    MyTable
  },
  methods: {
    del (id) {
      this.list = this.list.filter(item => item.id != id)
    },
    view (item) {
      console.log(item)
      alert(`姓名：${item.name}; 年龄：${item.age};`)
    }
  }
}
</script>
```

**MyTable.vue**

```html
<template>
  <table class="my-table">
    <thead>
      <tr>
        <th>序号</th>
        <th>姓名</th>
        <th>年纪</th>
        <th>操作</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(item, index) in data" :key="item.id">
        <td>{{ index + 1}}</td>
        <td>{{ item.name }}</td>
        <td>{{ item.age }}</td>
        <td>
          <!-- 给 slot标签，添加属性的方式传值 -->
          <slot :item="item" msg="test">
            <!-- 会将所有的属性添加到一个对象中 -->
          </slot>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script>
export default {
  props: {
    data: Array,
  },
}
</script>

<style scoped>
</style>
```