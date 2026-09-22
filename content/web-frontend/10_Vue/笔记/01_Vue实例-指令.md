# Vue

Vue 是一个构建用户界面的渐进式框架，也就是 UI 框架。

## 创建 Vue 实例

**创建 Vue实例，初始化渲染：**
1. 准备容器（Vue所管理的范围）
2. 引包（开发版本包 / 生产版本包（官网找））
3. 创建实例
4. 添加配置项 => 完成渲染

```html
<div id="app">
  <!-- 这里将来会编写一些用于渲染的代码逻辑 -->
  <h1>{{ msg }}</h1>
  <a href="#">{{ count }}</a>
</div>

<!-- 引入的时是开发版本包 - 包含完整的注释和警告 -->
<!-- <script src="https://cdn.jsdelivr.net/npm/vue@2.7.16/dist/vue.js"></script> -->
<script src="./vue.js"></script>

<script>
  // 一旦引入 VueJS核心包，在全局环境，就有了 Vue 构造函数
  const app = new Vue({
    // 通过 el 配置选择器，指定 Vue 管理的是哪个盒子（el指定挂载点）
    el: "#app",
    // 通过 data提供数据
    data: {
      msg: "Hello Vue.js",
      count: 666
    }
  })
</script>
```

## 插值表达式

**插值表达式：**
- 作用：利用表达式进行插值渲染
- 语法： `{{ 表达式 }}`

**注意点：**
1. 使用的数据要存在
2. 支持的是表达式，不是语句 `if`，`for`
3. 不能在**标签属性中**使用 `{{ }}`

```html
<div id="app">
  <p>{{ nickname }}</p>
  <p>{{ nickname.toUpperCase() }}</p>
  <p>{{ nickname + '你好' }}</p>
  <p>{{ age >= 18 ? '成年' : '未成年' }}</p>
  <p>{{ friend.hobby }}</p>
  <p>{{ friend.name }}</p>
</div>

<script>
  const app = new Vue({
    el: "#app",
    data: {
      nickname: "tony",
      age: 18,
      friend: {
        name: 'pony',
        hobby: '热爱学习Vue',
      },
    }
  })
</script>
```

## 响应式

**响应式：**
- 数据变化，视图自动更新

访问 data 中的数据，最终会被添加到实例上
1. 访问数据：实例.属性名
2. 修改数据：实例.属性名 = 新值

```html
<div id="app">
  {{ msg }}
</div>

<script>
  const app = new Vue({
    el: '#app',
    data: {
      // 响应式数据 -> 数据变化了，视图自动更新
      msg: '你好，黑马',
    },
  })
</script>
```

## Vue 指令

Vue 会根据不同的 指令，针对标签实现不同的功能

**指令：** 带有 v-前缀 的特殊标签属性

### v-html

相当于 JS 的 innerHTML，可以渲染 HTML 代码

```html
<div id="app">
  <div v-html="msg"></div>
</div>

<script>
  const app = new Vue({
    el: '#app',
    data: {
      msg: `
        <h3>Java 炒粉</h3>
      `
    }
  })
</script>
```

### v-show | v-if

v-show：切换 css 的 display：none 来控制显示隐藏（频繁切换显示隐藏的场景）

v-if：根据判断条件控制元素的创建和移除（条件渲染）（要么显示，要么隐藏，不频繁切换的场景）

```html
<div id="app">
  <div v-show="flag" class="box">我是v-show控制的盒子</div>
  <div v-if="flag" class="box">我是v-if控制的盒子</div>
</div>

<script>
  const app = new Vue({
    el: '#app',
    data: {
      flag: false
    }
  })
</script>
```

### v-else | v-else-if

```html
<div id="app">
  <p v-if="gender === 1">性别：♂ 男</p>
  <p v-else>性别：♀ 女</p>

  <hr>

  <p v-if="score >= 90">成绩评定A：奖励电脑一台</p>
  <p v-else-if="score >= 80">成绩评定B：奖励周末郊游</p>
  <p v-else-if="score >= 60">成绩评定C：奖励零食礼包</p>
  <p v-else>成绩评定D：惩罚一周不能玩手机</p>
</div>

<script>

  const app = new Vue({
    el: '#app',
    data: {
      gender: 1,
      score: 85
    }
  })
</script>
```

### v-on

**作用：** 注册事件 = 添加监听 + 提供处理逻辑
**语法：**
- v-on:事件名 = "内联语句"
- v-on:事件名 = "methods中的函数名"
- 简写：@事件名

#### 内联语句

```html
<div id="app">
  <!-- <button v-on:click="count--">-</button> -->
  <button @click="count--">-</button>
  <span>{{ count }}</span>
  <!-- <button v-on:click="count++">+</button> -->
  <button @click="count++">+</button>
</div>

<script>
  const app = new Vue({
    el: '#app',
    data: {
      count: 100
    }
  })
</script>
```

#### 配置 methods 函数

```html
<div id="app">
  <button @click="fn">切换显示隐藏</button>
  <h1 v-show="isShow">程序员</h1>
</div>

<script>
  const app = new Vue({
    el: '#app',
    data: {
      isShow: true
    },
    methods: {
      fn() {
        // 让提供所有的 methods中的函数，this都指向当前实例
        this.isShow = !this.isShow
      }
    }
  })
</script>
```

#### 参数传递

```html
<div id="app">
  <div class="box">
    <h3>小黑自动售货机</h3>
    <button @click="buy(5)">可乐5元</button>
    <button @click="buy(10)">咖啡10元</button>
  </div>
  <p>银行卡余额：{{ money }}元</p>
</div>

<script>
  const app = new Vue({
    el: '#app',
    data: {
      money: 1000,
    },
    methods: {
      buy(price) {
        this.money -= price
      }
    }
  })
</script>
```

### v-bind

作用：动态的设置 html 的标签属性 → `src` `url` `title` ...
语法：`v-bind:属性名="表达式"`
注意：简写形式 `:属性名="表达式"`

```html
<div id="app">
  <!-- v-bind:src=""  =>  :src="" -->
  <img v-bind:src="imgUrl" v-bind:title="msg" v-bind:alt="msg">
  <img :src="imgUrl" :title="msg" :alt="msg">
</div>

<script>
  const app = new Vue({
    el: '#app',
    data: {
      imgUrl: './imgs/10-02.png',
      msg: 'Hello 波仔',
    }
  })
</script>
```

**案例：波仔的学习之旅**
```html
<div id="app">
  <button v-show="index > 0" @click="index--">上一页</button>
  <div>
    <img :src="list[index]">
  </div>
  <button v-show="index < list.length - 1" @click="index++">下一页</button>
</div>

<script>
  const app = new Vue({
    el: '#app',
    data: {
      index: 0,
      list: [
        './imgs/11-00.gif',
        './imgs/11-01.gif',
        './imgs/11-02.gif',
        './imgs/11-03.gif',
        './imgs/11-04.png',
        './imgs/11-05.png',
      ],
    },
  })
</script>
```

### v-for

作用： 基于数据循环， 多次渲染整个元素 → 数组、对象、数字...
遍历数组语法：
- `v-for = "(item, index) in 数组"`
- `item` 每一项， `index` 下标
- 省略 `index`: `v-for = "item in 数组"`

```html
<div id="app">
  <h3>小黑水果店</h3>
  <ul>
    <li v-for="(item, index) in list">
      {{ item }} - {{ index }}
    </li>
    <br>
    <li v-for="item in list">
      {{ item }}
    </li>
  </ul>
</div>

<script>
  const app = new Vue({
    el: '#app',
    data: {
      list: ['西瓜', '苹果', '鸭梨', '榴莲']
    }
  })
</script>
```

**案例：波仔的书架**
```html
<div id="app">
  <h3>小黑的书架</h3>
  <ul>
    <li v-for="(item, index) in booksList">
      <span>{{ item.name }}</span>
      <span>{{ item.author }}</span>
      <!-- 注册点击事件 -> 通过 id进行删除数组中的对应项 -->
      <button @click="del(item.id)">删除</button>
    </li>
  </ul>
</div>

<script>
  const app = new Vue({
    el: '#app',
    data: {
      booksList: [
        { id: 1, name: '《红楼梦》', author: '曹雪芹' },
        { id: 2, name: '《西游记》', author: '吴承恩' },
        { id: 3, name: '《水浒传》', author: '施耐庵' },
      ]
    },
    methods: {
      del(id) {
        // 通过 id进行删除数组中的对应项 -> filter（不会改变原数组）
        // filter：根据条件，保留满足条件的对应项，得到一个新数组
        this.booksList = this.booksList.filter(item => item.id !== id)
      }
    }
  })
</script>
```

#### key

语法：key 属性 = "唯一标识"
作用：给列表项添加的唯一标识。便于 Vue 进行列表项的正确排序复用。

**注意点：**
- key 的值只能是 `字符串` 或 `数字类型`
- key 的值必须具有 `唯一性`
- **推荐使用 `id` 作为 key（唯一），不推荐使用 index 作为 key（会变化，不对应）**

```html
<div id="app">
  <h3>小黑的书架</h3>
  <ul>
    <!-- 给元素添加的唯一标识，便于 Vue进行列表项的正确排序复用 -->
    <li v-for="(item, index) in booksList" :key="item.id">
      <span>{{ item.name }}</span>
      <span>{{ item.author }}</span>
      <button @click="del(item.id)">删除</button>
    </li>
  </ul>
</div>

<script>
  const app = new Vue({
    el: '#app',
    data: {
      booksList: [
        { id: 1, name: '《红楼梦》', author: '曹雪芹' },
        { id: 2, name: '《西游记》', author: '吴承恩' },
        { id: 3, name: '《水浒传》', author: '施耐庵' },
        { id: 4, name: '《三国演义》', author: '罗贯中' }
      ]
    },
    methods: {
      del(id) {
        this.booksList = this.booksList.filter(item => item.id !== id)
      }
    }
  })
</script>
```

### v-model

作用: 给 表单元素 使用, 双向数据绑定 → 可以快速**获取**或**设置**表单元素内容：
1. 数据变化 → 视图自动更新
2. 视图变化 → 数据自动更新

语法: `v-model = '变量'`

```html
<div id="app">
  账户：<input type="text" v-model="username"> <br><br>
  密码：<input type="password" v-model="password"> <br><br>
  <button @click="login">登录</button>
  <button @click="reset">重置</button>
</div>

<script>
  const app = new Vue({
    el: '#app',
    data: {
      username: '',
      password: ''
    },
    methods: {
      login() {
        alert(this.username +  ' ' + this.password)
      },
      reset() {
        this.username = this.password = ''
      }
    }
  })
</script>
```