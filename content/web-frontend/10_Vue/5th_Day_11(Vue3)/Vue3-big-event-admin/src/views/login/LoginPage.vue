<script setup>
import { userLoginService, userRegisterService } from '@/api/user'
import router from '@/router'
import { useUserStore } from '@/stores'
import { User, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { ref, watch } from 'vue'

let isRegister = ref(false)
// 整个的用于提交的 form数据对象
const formModel = ref({
  username: '',
  password: '',
  repassword: ''
})

// 表单提交的校验规则
// 1. 非空校验 required: true，message消息提示，trigger触发校验的时机 blur change
// 2. 长度校验 min max
// 3. 正则校验 pattern：正则规则
// 4. 自定义校验规则 => 自己写校验规则
//    validator: (rule, value, callback) => {}
//      rule: 当前正在校验的规则
//      value: 当前正在校验的表单元素的值
//      callback: 函数，调用它表示校验通过，否则不通过
//        callback(new Error('错误提示')) 校验失败
//        callback() 校验通过
const rules = {
  username: [
    { 
      required: true, 
      message: '请输入用户名', 
      trigger: 'blur'
    },
    { 
      min: 5, 
      max: 10, 
      message: '用户名必须是5到10位字符', 
      trigger: 'blur'
    }
  ],
  password: [
    { 
      required: true, 
      message: '请输入密码', 
      trigger: 'blur'
    },
    { 
      pattern: /^[a-zA-Z]\w{5,14}$/, 
      message: '密码以字母开头，长度在6到15位', 
      trigger: 'blur'
    }
  ],
  repassword: [
    { 
      required: true, 
      message: '请输入密码', 
      trigger: 'blur'
    },
    { 
      pattern: /^[a-zA-Z]\w{5,14}$/, 
      message: '密码以字母开头，长度在6到15位', 
      trigger: 'blur'
    },
    {
      validator: (rule, value, callback) => {
        // 判断 value 和 当前 form 中收集的 password 是否一致
        if (value !== formModel.value.password) {
          callback(new Error('两次密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const form = ref()

// 注册按钮的点击事件
const resgister = async () => {
  // 注册成功之前，先进行校验，校验成功 => 请求，校验失败 => 自动提示
  await form.value.validate()
  await userRegisterService(formModel.value)
  ElMessage.success('注册成功')
  isRegister.value = false
}

// 切换的时候，重置表单内容 
watch(isRegister, () => {
  formModel.value = {
    username: '',
    password: '',
    repassword: ''
  }
})

const userStore = useUserStore()
// 登录按钮的点击事件
const login = async () => {
  await form.value.validate()
  const res = await userLoginService(formModel.value)
  userStore.setToken(res.data.token)
  ElMessage.success('登录成功')
  router.push('/')
}


</script>

<template>
  <!-- 
   校验 
    (1) el-form => :model="ruleForm" 绑定的整个 form的数据对象 {xxx, xxx, xxx}
    (2) el-form => :rules="rules" 绑定的整个 rules规则对象  {xxx, xxx, xxx}
    (3) 表单元素 => v-model="ruleForm.xxx" 给表单元素，绑定 form的子属性
    (4) el-form-item prop配置生效的是哪个校验规则 (和 rules中的字段要对应) 
   -->
  <el-row class="login-page">
    <el-col :span="12" class="bg"></el-col>
    <el-col :span="6" :offset="3" class="form">
      <!-- 注册相关表单 -->
      <el-form 
        :model="formModel"
        :rules="rules"
        ref="form"
        size="large"
        autocomplete="off"
        v-if="isRegister">
        <el-form-item>
          <h1>注册</h1>
        </el-form-item>
        <el-form-item prop="username">
          <el-input 
            v-model="formModel.username"
            :prefix-icon="User" 
            placeholder="请输入用户名">
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="formModel.password"
            :prefix-icon="Lock"
            type="password"
            placeholder="请输入密码"
          ></el-input>
        </el-form-item>
        <el-form-item prop="repassword">
          <el-input
            v-model="formModel.repassword"
            :prefix-icon="Lock"
            type="password"
            placeholder="请输入再次密码"
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-button @click="resgister" class="button" type="primary" auto-insert-space>
            注册
          </el-button>
        </el-form-item>
        <el-form-item class="flex">
          <el-link type="info" :underline="false" @click="isRegister = false">
            ← 返回
          </el-link>
        </el-form-item>
      </el-form>
      <!-- 登录相关表单 -->
      <el-form 
        :model="formModel"
        :rules="rules"
        ref="form" 
        size="large" 
        autocomplete="off" 
        v-else>
        <el-form-item>
          <h1>登录</h1>
        </el-form-item>
        <el-form-item prop="username" >
          <el-input
            v-model="formModel.username"
            :prefix-icon="User" 
            placeholder="请输入用户名">
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="formModel.password"
            name="password"
            :prefix-icon="Lock"
            type="password"
            placeholder="请输入密码"
          ></el-input>
        </el-form-item>
        <el-form-item class="flex">
          <div class="flex">
            <el-checkbox>记住我</el-checkbox>
            <el-link type="primary" :underline="false">忘记密码？</el-link>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button @click="login" class="button" type="primary" auto-insert-space
            >登录</el-button
          >
        </el-form-item>
        <el-form-item class="flex">
          <el-link type="info" :underline="false" @click="isRegister = true">
            注册 →
          </el-link>
        </el-form-item>
      </el-form>
    </el-col>
  </el-row>
</template>

<style lang="scss" scoped>
.login-page {
  height: 100vh;
  background-color: #fff;
  .bg {
    background: url('@/assets/logo2.png') no-repeat 60% center / 240px auto,
      url('@/assets/login_bg.jpg') no-repeat center / cover;
    border-radius: 0 20px 20px 0;
  }
  .form {
    display: flex;
    flex-direction: column;
    justify-content: center;
    user-select: none;
    .title {
      margin: 0 auto;
    }
    .button {
      width: 100%;
    }
    .flex {
      width: 100%;
      display: flex;
      justify-content: space-between;
    }
  }
}
</style>
