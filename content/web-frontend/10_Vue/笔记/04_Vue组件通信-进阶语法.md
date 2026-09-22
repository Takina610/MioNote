# 组件三大部分

**template**：只有能一个根元素

**style**：全局样式(默认)：影响所有组件。局部样式：**`scoped`** 下样式，只作用于当前组件

**script**：el 根实例独有，**data 是一个函数**，其他配置项一致。

## 组件的样式冲突 scoped

默认情况：写在组件中的样式会 **全局生效** → 因此很容易造成多个组件之间的样式冲突问题。
- **全局样式**：默认组件中的样式会作用到全局
- **局部样式**：可以给组件加上 **`scoped`** 属性，**可以让样式只作用于当前组件**。

### scoped 原理

- 给当前组件模板的所有元素，都会添加上一个自定义属性 `data-v-hash值` -> `data-v-5f6a9d56` 用于区分开不通的组件。
- css选择器后面，被自动处理，添加上了属性选择器：`div[data-v-5f6a9d56]`
```css
div /*(div[data-v-5f6a9d56])*/ {
  border: 3px solid blue;
  margin: 30px;
}
```

## data 是一个函数

一个组件的 **data** 选项必须是一个**函数**。→ 保证每个组件实例，维护**独立**的一份数据对象。

每次创建新的组件实例，都会新执行一次 **data** 函数，得到一个新对象。

```js
// data() {
//   console.log('函数执行了')
//   return {
//     count: 100,
//   }
// },
data: function () {
  return {
    count: 100,
  }
}
```

# 组件通信

组件通信, 就是指 **组件与组件** 之间的数据传递。

- 组件的数据是**独立**的，无法直接访问其他组件的数据。
- 想用其他组件的数据 → 组件通信。

**父子关系使用**：`props` 和 `$emit`

**非父子关系使用**： `provide` & `inject` 或 eventBus

通用的方式：Vuex（适合复杂业务场景）。

## 父子组件通信

- 父组件通过 `props` 将数据传递给子组件
- 子组件利用 `$emit` 通知父组件修改更新

![](./assets/Snipaste_2025-05-26_11-00-01.png)

### 父 -> 子

**① 父中给子添加属性传值 ② 子 `props` 接收 ③ 子组件使用**

**父组件：**

```html
<template>
  <div class="app">
    我是父组件
    <!-- 1.给组件标签，添加属性方式 赋值 -->
    <Son :title="myTitle"></Son>
  </div>
</template>

<script>
import Son from "./components/Son.vue"
export default {
  name: "App",
  components: {
    Son,
  },
  data() {
    return {
      myTitle: "学前端，就来程序员",
    }
  },
}
</script>

<style>
</style>
```

**子组件：**

```html
<template>
  <div class="son">
    <!-- 3.直接使用 props 的值 -->
    我是Son组件
    {{ title }}
  </div>
</template>

<script>
export default {
  name: 'Son-Child',
  // 2.通过props来接受
  props: ['title'],
}
</script>

<style>
</style>
```

![](./assets/Snipaste_2025-05-26_11-02-25.png)

### 子 -> 父

**① 子 `$emit` 发送消息 ② 父中给子添加消息监听 ③ 父中实现处理函数**

**父组件：**

```html
<template>
  <div class="app">
    我是APP组件
    <!-- 2.父组件，对消息进行监听 -->
    <Son :title="myTitle" @changeTitle="handleChange"></Son>
  </div>
</template>

<script>
import Son from "./components/Son.vue"
export default {
  name: "App",
  components: {
    Son,
  },
  data() {
    return {
      myTitle: "学前端，就来程序员",
    }
  },
  methods: {
    handleChange(newTitle) {
      this.myTitle = newTitle
    }
  }
}
</script>

<style>
</style>
```

**子组件：**

```html
<template>
  <div class="son">
    我是Son组件
    {{ title }}
    <button @click="changeFn">修改titile</button>
  </div>
</template>

<script>
export default {
  name: 'Son-Child',
  props: ['title'],
  methods: {
    changeFn() {
      // 1.通过 $emit，向父组件发送消息通知
      this.$emit('changeTitle', '传智教育')
    }
  }
}
</script>

<style>
</style>
```

![](./assets/Snipaste_2025-05-26_11-05-32.png)

# prop

Prop 定义：**组件上** 注册的一些 **自定义属性**

Prop 作用：向子组件传递数据

**特点：**
- 可以 传递 **任意数量** 的prop
- 可以 传递 **任意类型** 的prop

**父组件：**

```html
<template>
  <div class="app">
    <UserInfo
      :username="username"
      :age="age"
      :isSingle="isSingle"
      :car="car"
      :hobby="hobby"
    ></UserInfo>
  </div>
</template>

<script>
import UserInfo from './components/UserInfo.vue'
export default {
  data() {
    return {
      username: '小帅',
      age: 28,
      isSingle: true,
      car: {
        brand: '宝马',
      },
      hobby: ['篮球', '足球', '羽毛球'],
    }
  },
  components: {
    UserInfo,
  },
}
</script>

<style>
</style>
```

**子组件：**

```html
<template>
  <div class="userinfo">
    <h3>我是个人信息组件</h3>
    <div>姓名：{{ username }} </div>
    <div>年龄：{{ age }} </div>
    <div>是否单身：{{ isSingle ? '是' : '否' }} </div>
    <div>座驾：{{ car.brand }} </div>
    <div>兴趣爱好 {{ hobby.join(', ') }} </div>
  </div>
</template>

<script>
export default {
  props: ['username', 'age', 'isSingle', 'car', 'hobby']
}
</script>

<style>
</style>
```

![](./assets/Snipaste_2025-05-26_11-11-42.png)

# props 校验

组件的 prop 可以乱传么？

为组件的 prop 指定**验证要求**，不符合要求，控制台就会有**错误提示** → 帮助开发者，快速发现错误。

**语法：**
- **类型校验**
- 非空校验
- 默认值
- 自定义校验

```js
props: {
  校验的属性名: 类型 // Number String Boolean ...
},

props: {
  校验的属性名: {
    type: 类型, // Number String Boolean ...
    required: true, // 是否必填
    default: 默认值, // 默认值
    validator (value) {
      // 自定义校验逻辑
      return 是否通过校验
    }
  }
},
```

**父组件：**

```html
<template>
  <div class="app">
    <BaseProgress :w="width"></BaseProgress>
  </div>
</template>

<script>
import BaseProgress from './components/BaseProgress.vue'
export default {
  data() {
    return {
      width: 50,
    }
  },
  components: {
    BaseProgress,
  },
}
</script>

<style>
</style>
```

**子组件：**

```html
<template>
  <div class="base-progress">
    <div class="inner" :style="{ width: w + '%' }">
      <span>{{ w }}%</span>
    </div>
  </div>
</template>

<script>
export default {
  // props: ["w"],

  // 1.基础写法（类型校验）
  // props: {
  //   w: Number
  // }
  // 2.完整写法（类型、是否必填、默认值、自定义校验）
  props: {
    w: {
      type: Number,
      // 是在父类使用组件时，看其是否用自定义属性绑定了
      require: true,
      default: 80,
      validator(value) {
        if(value >= 0 && value <= 100) {
          return true
        } else {
          console.error("错误")
          return false
        }
      }
    }
  }
}
</script>

<style>
</style>
```

# prop & data、单向数据流

三者共同点：都可以给组件提供数据。

**区别：**
- data 的数据是**自己**的 → 随便改
- prop 的数据是**外部**的 → 不能直接改，要遵循 **单向数据流**

单向数据流：父级 prop 的数据更新，会向下流动，影响子组件。这个数据流动是单向的。

==**谁的数据谁负责**==

# 非父子通信 (拓展) - event bus 事件总线

作用：非父子组件之间，进行简易消息传递。(复杂场景 → Vuex)

1. 创建一个都能访问到的事件总线 (空 Vue 实例) → utils/EventBus.js

```js
import Vue from 'vue'
const Bus = new Vue()
export default Bus
```

2. B 组件(发送方)，触发 **Bus 实例**的事件

```js
sendMsgFn () {
  Bus.$emit('sendMsg', '今天天气晴朗')
}
```

3. A 组件(接收方)，监听 **Bus 实例**的事件

```js
created () {
  Bus.$on('sendMsg', (msg) => {
    this.msg = msg
  })
}
```

![](./assets/Snipaste_2025-05-26_11-27-29.png)

**EveentBus.js**

```js
// 1. 创建一个都能访问到的事件总线（空的 Vue实例）
import Vue from 'vue'
const Bus = new Vue()
export default Bus
```

**BaseA.vue**：

```html
<template>
  <div class="base-a">
    我是A组件（接受方）
    <p>{{ msg }}</p> 
  </div>
</template>

<script>
import Bus from '../utils/EventBus'
export default {
  created () {
    // 2. 在 A组件（接收方），进行监听 Bus 的事件（订阅事件）
    Bus.$on('sendMsg', (msg) => {
      this.msg = msg
    })
  }, 
  data () {
    return {
      msg: ''
    }
  }
}
</script>

<style>
</style>
```

**BaseB.vue**：

```html
<template>
   <div class="base-b">
    <div>我是B组件（发布方）</div>
    <button @click="sendMsgFn">发送消息</button>
  </div>
</template>

<script>
import Bus from '../utils/EventBus'
export default {
  methods: {
    sendMsgFn () {
      // 3. 在 B组件（发送方）触发事件的方式传递参数（发布消息）
      Bus.$emit('sendMsg', '今天天气晴朗')
    }
  }
}
</script>

<style>
</style>
```

**BaseC.vue**：

```html
<template>
  <div class="base-c">
    我是C组件（接受方）
    <p>{{ msg }}</p> 
  </div>
</template>

<script>
import Bus from '../utils/EventBus'
export default {
  created () {
    // 2. 在 A组件（接收方），进行监听 Bus的事件（订阅事件）
    Bus.$on('sendMsg', (msg) => {
      this.msg = msg
    })
  }, 
  data () {
    return {
      msg: ''
    }
  }
}
</script>

<style>
</style>
```

# 非父子通信 (拓展) - provide & inject

provide & inject 作用：**跨层级共享数据**。

1. 父组件 provide 提供数据
```js
export default {
  provide () {
    return {
      color: this.color,
      userInfo: this.userInfo
    }
  },
}
```

2. 子/孙组件 inject 取值使用

```js
export default {
  inject: ['color', 'userInfo']
}
```

![](./assets/Snipaste_2025-05-26_11-57-44.png)

**父组件：**

```html
<template>
  <div class="app">
    我是APP组件
    <button @click="change">修改数据</button>
    <SonA></SonA>
  </div>
</template>

<script>
import SonA from './components/SonA.vue'
export default {
  provide () {
    return {
      color: this.color,
      userInfo: this.userInfo
    }
  },
  data() {
    return {
      color: 'pink', // 简单类型（非响应式）
      userInfo: { // 复杂类型（响应式）
        name: 'zs',
        age: 18,
      },
    }
  },
  methods: {
    change () {
      this.name = 'green',
      this.userInfo.name = 'ls',
      this.userInfo.age = 20
    }
  },
  components: {
    SonA,
  },
}
</script>

<style>
</style>
```

**SonA.vue：**

```html
<template>
  <div class="SonA">我是SonA组件
    <GrandSon></GrandSon>
  </div>
</template>

<script>
import GrandSon from '../components/GrandSon.vue'
export default {
  components:{
    GrandSon
  }
}
</script>

<style>
</style>
```

**GrandSon.vue：**

```html
<template>
  <div class="GrandSon">
    我是GrandSon组件
    <div>颜色：{{ color }}</div>
    <div>用户名：{{ userInfo.name }}</div>
    <div>用户年龄：{{ userInfo.age }}</div>
  </div>
</template>

<script>
import { provide, inject } from 'vue'
export default {
  inject: ['color', 'userInfo'],
}
</script>

<style>
</style>
```

# 进阶语法

## v-model 原理

原理：`v-model` 本质上是一个**语法糖**。例如应用在输入框上，就是 **value属性** 和 **input事件** 的合写。

**作用：提供数据的双向绑定**
- 数据变，视图跟着变 `:value`
- 视图变，数据跟着变 `@input`

注意：**`$event`** 用于在模板中，获取事件的形参。

```html
<template>
  <div class="app">
    <input v-model="msg1" type="text" />
    <br />
    <!-- 模板中获取事件的形参 -> $event获取 -->
    <input :value="msg2" @input="msg2 = $event.target.value" type="text" >
  </div>
</template>

<script>
export default {
  data() {
    return {
      msg1: '',
      msg2: ''
    }
  },
}
</script>

<style>
</style>
```

### 表单类组件封装

表单类组件 封装 -> 实现 子组件 和 父组件数据 的**双向绑定**。
- 父传子：数据 应该是父组件 props 传递 过来的，拆解 v-model 绑定数据
- 子传父：监听输入，子传父传值给父组件修改。

**App.vue**
```html
<template>
  <div class="app">
    <!-- 此处传递过来的是 e.target.value -->
    <BaseSelect @changeId="selectId = $event" :cityId="selectId"></BaseSelect>
  </div>
</template>

<script>
import BaseSelect from './components/BaseSelect.vue'
export default {
  data() {
    return {
      selectId: '104',
    }
  },
  components: {
    BaseSelect,
  },
  methods: {
    handleChange(e) {
      console.log(e);
      this.selectId = e
    }
    
  }
}
</script>

<style>
</style>
```

**BaseSelect.vue**
```html
<template>
  <div>
    <select :value="cityId" @change="handleChange">
      <option value="101">北京</option>
      <option value="102">上海</option>
    </select>
  </div>
</template>

<script>
export default {
  props: {
    cityId: String,
  },
  methods: {
    handleChange (e) {
      this.$emit('changeId', e.target.value)
    }
  }
}
</script>

<style>
</style>
```

**可以直接使用 `v-model` 简化代码**

**App.vue**

```html
<template>
  <div class="app">
    <!-- v-model => :value + @input -->
    <BaseSelect v-model="selectId"></BaseSelect>
  </div>
</template>

<script>
import BaseSelect from './components/BaseSelect.vue'
export default {
  data() {
    return {
      selectId: '103',
    }
  },
  components: {
    BaseSelect,
  },
}
</script>

<style>
</style>
```

**BaseSelect.vue**

```html
<template>
  <div>
    <select :value="value" @change="handleChange">
      <option value="101">北京</option>
      <option value="102">上海</option>
    </select>
  </div>
</template>

<script>
export default {
  props: {
    value: String,
  },
  methods: {
    handleChange (e) {
      this.$emit('input', e.target.value)
    }
  }
}
</script>

<style>
</style>
```

## .sync 修饰符

**作用：** 可以实现 **子组件** 与 **父组件数据** 的 **双向绑定**，简化代码

**特点：** `prop` 属性名，可以**自定义**，非固定为 `value`

**场景：** 封装弹框类的基础组件， **visible属性** true显示 false隐藏

**本质：** 就是 **`:属性名`** 和 **`@update:属性名`** 合写

```html
<BaseDialog :visible.sync="isShow" />
--------------------------------------
<BaseDialog
  :visible="isShow"
  @update:visible="isShow = $event"
/>
```
```js
props: {
  visible: Boolean
}

close () {
  this.$emit('update:visible', false)
}
```

## ref 和 $refs

**作用：** 利用 `ref` 和 `$refs` 可以用于 **获取 dom 元素**, 或 **组件实例**。

**特点**：查找范围 → 当前组件内 (更精确稳定)

**获取 dom：**

1. 目标标签 - 添加 ref 属性

```html
<div ref="dom"></div>
```

2. 通过 this.$refs.xxx, 获取目标 dom 元素

```js
mounted () {
  console.log(this.$refs.dom)
},
```

```html
<div ref="mychart" class="box">子组件</div>
```
```js
// 基于准备好的dom，初始化 echarts 实例
// const myChart = echarts.init(document.querySelector('.box'))
const myChart = echarts.init(this.$refs.mychart)
```

**获取组件：**

1. 目标组件 – 添加 ref 属性

```html
<BaseForm ref="baseForm"></BaseForm>
```

2. 恰当时机, 通过 this.$refs.xxx, 获取目标组件，就可以调用组件对象里面的方法

```js
this.$refs.baseForm.组件方法()
```

## Vue异步更新、$nextTick

**需求：** 编辑标题, 编辑框自动聚焦

![](./assets/Snipaste_2025-05-26_12-40-47.png)

1. 点击编辑，显示编辑框

2. 让编辑框，立刻获取焦点

```js
this.isShowEdit = true // 显示输入框
this.$refs.inp.focus() // 获取焦点
```

**问题：**"显示之后"，立刻获取焦点是不能成功的！

**原因： Vue 是 异步更新 DOM (提升性能)**

**解决方案：**

`$nextTick`：**等 DOM 更新后**, 才会触发执行此方法里的函数体

**语法:** `this.$nextTick(函数体)`

```js
this.$nextTick(() => {
  this.$refs.inp.focus()
})
```

```html
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
```