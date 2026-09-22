# Vue指令

## 指令修饰符

通过 `.` 指明一些指令**后缀**，不同**后缀**封装了不同的处理操作 → 简化代码

- 按键修饰符：`@keyup.enter` → 键盘回车监听
- `v-model` 修饰符：
  - `v-model.trim` → 去除首尾空格
  - `v-model.number` → 转为数字类型
- 时间修饰符：
  - `@事件名.stop` → 阻止冒泡
  - `@事件名.prevent` → 阻止默认行为

```html
<div id="app">
  <h3>@keyup.enter → 监听键盘回车事件</h3>
  <input @keyup.enter="fn" @click="fn" v-model="username" type="text">
</div>

<script>
  const app = new Vue({
    el: '#app',
    data: {
      username: ''
    },
    methods: {
      fn(e) {
        console.log(e)
        console.log(this.username, '键盘回车的时候触发')
      }
    }
  })
</script>
```

```html
<div id="app">
  <h3>v-model修饰符 .trim .number</h3>
  姓名：<input v-model.trim="username" type="text"><br>
  年纪：<input v-model.number="age" type="text"><br>

  
  <h3>@事件名.stop → 阻止冒泡</h3>
  <div @click="fatherFn" class="father">
    <div @click.stop="sonFn" class="son">儿子</div>
  </div>

  <h3>@事件名.prevent → 阻止默认行为</h3>
  <!-- 取消了 a 标签的跳转功能 -->
  <a @click.prevent href="http://www.baidu.com">阻止默认行为</a>
</div>

<script>
  const app = new Vue({
    el: '#app',
    data: {
      username: '',
      age: '',
    },
    methods: {
      fatherFn () {
        alert('老父亲被点击了')
      },
      sonFn (e) {
        // e.stopPropagation()
        alert('儿子被点击了')
      }
    }
  })
</script>
```

## v-bind

### 对于样式 class 的控制

```html
<style>
  .pink {
    background-color: pink;
  }
  .big {
    width: 300px;
    height: 300px;
  }
</style>

<div id="app">
  <div class="box" :class="{pink: true, big: false}">程序员</div>
  <div class="box" :class="['pink', 'big']">程序员</div>
</div>

<script>
  const app = new Vue({
    el: '#app',
  })
</script>
```

**案例-tab栏的active效果-静态结构**

```html
<div id="app">
  <ul>
    <li v-for="(item, index) in list" :key="item.id" @click="activeIndex = index">
      <a :class="{active: activeIndex === index}" href="#">{{ item.name }}</a>
    </li>
  </ul>
</div>

<script>
  const app = new Vue({
    el: '#app',
    data: {
      activeIndex: 0, // 控制高亮的索引
      list: [
        { id: 1, name: '京东秒杀' },
        { id: 2, name: '每日特价' },
        { id: 3, name: '品类秒杀' }
      ]

    }
  })
</script>
```

### 对于样式 style 的控制
```html
<div id="app">
  <div class="box" :style="{width: '400px', height: '400px', backgroundColor: 'green'}"></div>
</div>

<script>
  const app = new Vue({
    el: '#app',
  })
</script>
```

**案例-进度条效果-静态样式**
```html
<div id="app">
  <div class="progress">
    <div class="inner" :style="{width: percent + '%'}">
      <span>{{ percent }}%</span>
    </div>
  </div>
  <button @click="percent = 25">设置25%</button>
  <button @click="percent = 50">设置50%</button>
  <button @click="percent = 75">设置75%</button>
  <button @click="percent = 100">设置100%</button>
</div>

<script>
  const app = new Vue({
    el: '#app',
    data: {
      percent: 25
    }
  })
</script>
```

## v-model

常见的表单元素都可以用 `v-model` 绑定关联 → 快速 **获取** 或 **设置** 表单元素的值

它会根据 **控件类型** 自动选取 **正确的方法** 来更新元素

- **输入框** `input:text` → `value`
- **文本域** `textarea` → `value`
- **复选框** `input:checkbox` → `checked`
- **单选框** `input:radio` → `checked`
- **下拉菜单** `select` → `value`
...

```html
<div id="app">
  <h3>小黑学习网</h3>

  姓名：
    <input v-model="username" type="text"> 
    <br><br>

  是否单身：
    <input v-model="isSingle" type="checkbox"> 
    <br><br>

  <!-- 
    前置理解：
      1. name: 给单选框加上 name 属性 可以分组 → 同一组互相会互斥
      2. value: 给单选框加上 value 属性，用于提交给后台的数据
    结合 Vue 使用 → v-model
  -->
  性别: 
    <input v-model="gender" type="radio" name="gender" value="1">男
    <input v-model="gender" type="radio" name="gender" value="2">女
    <br><br>

  <!-- 
    前置理解：
      1. option 需要设置 value 值，提交给后台
      2. select 的 value 值，关联了选中的 option 的 value 值
    结合 Vue 使用 → v-model
  -->
  所在城市:
    <select v-model="cityId">
      <option value="101">北京</option>
      <option value="102">上海</option>
      <option value="103">成都</option>
      <option value="104">南京</option>
    </select>
    <br><br>

  自我描述：
    <textarea v-model="desc"></textarea> 

  <button>立即注册</button>
</div>
<script>
  const app = new Vue({
    el: '#app',
    data: {
      username: '',
      isSingle: true,
      gender: '1',
      cityId: "102",
      desc: ""
    }
  })
</script>
```

# computed

**计算属性：**
- 概念：基于现有的数据，计算出来的新属性。 依赖的数据变化，自动重新计算。
- 语法：
  - 声明在 computed 配置项中，一个计算属性对应一个函数
  - 使用起来和普通属性一样使用 `{{ 计算属性名 }}`

**计算属性 → 可以将一段 求值的代码 进行封装**

```html
<div id="app">
  <h3>小黑的礼物清单</h3>
  <table>
    <tr>
      <th>名字</th>
      <th>数量</th>
    </tr>
    <tr v-for="(item, index) in list" :key="item.id">
      <td>{{ item.name }}</td>
      <td>{{ item.num }}个</td>
    </tr>
  </table>

  <!-- 目标：统计求和，求得礼物总数 -->
  <p>礼物总数：{{ totalCount }} 个</p>
</div>
<script>
  const app = new Vue({
    el: '#app',
    data: {
      // 现有的数据
      list: [
        { id: 1, name: '篮球', num: 2 },
        { id: 2, name: '玩具', num: 2 },
        { id: 3, name: '铅笔', num: 19 },
      ]
    },
    computed: {
      totalCount() {
        // 基于现有数据，编写求值逻辑
        // 计算属性函数内部，可以通过 this访问到 app实例
        // 需求：对 this.list数组里面的 num进行求和 -> reduce
        let total = this.list.reduce((sum, item) => sum + item.num, 0)
        // let total = 0
        // for (let index = 0; index < this.list.length; index++) {
        //   total += this.list[index].num
        // }
        return total
      }
    }
  })
</script>
```

### computed 计算属性 vs methods 方法

**computed 计算属性：**
**作用：** 封装了一段对于数据的处理，求得一个结果。
**语法：**
- 写在 computed 配置项中
- 作为属性，直接使用 → `this.计算属性`、`{{ 计算属性 }}`

**methods 方法：**
**作用：** 给实例提供一个方法，调用以处理业务逻辑。
**语法**：
- 写在 methods 配置项中
- 作为方法，需要调用 → `this.方法名()`、`{{ 方法名() }}`、`@事件名="方法名"`

**缓存特性（提升性能）：**
计算属性会对计算出来的结果缓存，再次使用直接读取缓存，依赖项变化了，会自动重新计算 → 并再次缓存

==总之：计算属性：有缓存的，一旦计算出来结果，就会立刻缓存。下一次读取 -> 直接读换成就行 -> 性能特别高。不会像 methods 一样重复调用==

### 完整写法

计算属性默认的简写，只能读取访问，不能 **"修改"**。

如果要 **"修改"** → 需要写计算属性的完整写法。

```js
computed: {
  计算属性名 () {
    一段代码逻辑（计算逻辑）
    return 结果
  }
}

computed: {
  计算属性名: {
    get() {
      一段代码逻辑（计算逻辑）
      return 结果
    },
    set(修改的值) {
      一段代码逻辑（修改逻辑）
    }
  }
}
```

```html
<div id="app">
  姓：<input type="text" v-model="firstName"><br>
  名：<input type="text" v-model="lastName"><br>
  <p>姓名：{{ fullName }}</p>
  <button @click="changeName">修改姓名</button>
</div>
<script src="./vue.js"></script>
<script>
  const app = new Vue({
    el: '#app',
    data: {
      firstName: '',
      lastName: ''
    },
    computed: {
      // 简写 -> 只配置了获取，没有配置设置的逻辑
      // fullName() {
      //   return this.firstName + this.lastName
      // }

      // 完整写法 -> 获取 + 设置
      fullName: {
        // (1) 当 fullName计算属性，被获取求值时，执行 get（有缓存）会将返回值作为求值的结果
        get() {
          return this.firstName + this.lastName
        },
        // (2) 当 fullName计算属性，被修改赋值时，执行 set，修改的值，传递给 set方法的形参
        set(value) {
          this.firstName = value.slice(0, 1)
          this.lastName = value.slice(1)
        }
      }
    },
    methods: {
      changeName() {
        this.fullName = "吕小布"
      }
    }
  })
</script>
```

# watch

**作用：** 监视数据变化，执行一些 **业务逻辑** 或 **异步操作**。
**语法：**
- 简单写法 → 简单类型数据，直接监视
- 完整写法 → 添加额外配置项，监视复杂类型数据

**简单写法 → 监视简单类型的变化**
```js
watch: {
  // 该方法会在数据变化时，触发执行
  数据属性名 (newValue, oldValue) {
    一些业务逻辑 或 异步操作。
  },
  '对象.属性名' (newValue, oldValue) {
    一些业务逻辑 或 异步操作。
  }
}
```

**完整写法 → 添加额外的配置项 (深度监视复杂类型，立刻执行)**
```js
watch: { // watch 完整写法
  数据属性名: {
    deep: true, // 深度监视(针对复杂类型)
    immediate: true, // 是否立刻执行一次 handler
    handler (newValue) {
      console.log(newValue)
    }
  }
}
```

```html
<div id="app">
  <!-- 条件选择框 -->
  <div class="query">
    <span>翻译成的语言：</span>
    <select v-model="obj.lang">
      <option value="italy">意大利</option>
      <option value="english">英语</option>
      <option value="german">德语</option>
    </select>
  </div>

  <!-- 翻译框 -->
  <div class="box">
    <div class="input-wrap">
      <textarea v-model.trim="obj.words"></textarea>
      <span><i>⌨️</i>文档翻译</span>
    </div>
    <div class="output-wrap">
      <div class="transbox">{{ result }}</div>
    </div>
  </div>
</div> 

<script>
  // 接口地址：https://applet-base-api-t.itheima.net/api/translate
  // 请求方式：get
  // 请求参数：
  // （1）words：需要被翻译的文本（必传）
  // （2）lang： 需要被翻译成的语言（可选）默认值-意大利
  // -----------------------------------------------
  
  const app = new Vue({
    el: '#app',
    data: {
      // words: '苹果',
      obj: {
        words: '苹果',
        lang: 'italy'
      },
      result: '',
      // timer: null // 延时器 Id
    },
    // 具体讲解：(1) watch语法 (2) 具体业务实现
    watch: {
      obj: {
        deep: true, // 深度监视
        immediate: true, // 立即执行，一进入页面就执行 handler
        handler (newValue) {
          clearTimeout(this.timer) // 延时器Id
          this.timer = setTimeout(async () => {
            const ret = await axios({
              url: 'https://applet-base-api-t.itheima.net/api/translate',
              params: newValue
            })
            this.result = ret.data.data
          }, 300)
        }
      }
      // 该方法会在数据变化时调用
      // words (newValue) {
      // },
      // 'obj.words' (newValue) {
      //   // 防抖：延迟执行 -> 干啥事先等一等，延迟一会，一段时间内没执行再触发
      //   clearTimeout(this.timer) // 延时器Id
      //   this.timer = setTimeout(async () => {
      //     const ret = await axios({
      //       url: 'https://applet-base-api-t.itheima.net/api/translate',
      //       params: {
      //         words: newValue
      //       }
      //     })
      //     this.result = ret.data.data
      //   }, 300)
      // }
    }
  })
</script>
```