<template>
  <div class="login">
    <van-nav-bar title="会员登录" left-arrow @click-left="$router.go(-1)" />
    <div class="container">
      <div class="title">
        <h3>手机号登录</h3>
        <p>未注册的手机号登录后将自动注册</p>
      </div>

      <div class="form">
        <div class="form-item">
          <input v-model="mobile" class="inp" maxlength="11" placeholder="请输入手机号码" type="text">
        </div>
        <div class="form-item">
          <input v-model="picCode" class="inp" maxlength="5" placeholder="请输入图形验证码" type="text">
          <img v-if="picUrl" :src=picUrl @click="getPicCode" alt="">
        </div>
        <div class="form-item">
          <input v-model="msgCode" class="inp" placeholder="请输入短信验证码" type="text">
          <button @click="getCode">
            {{ currentSecond === totalSecond ? '获取验证码' : currentSecond + '秒后重新发送' }}
          </button>
        </div>
      </div>

      <div @click="login" class="login-btn">登录</div>
    </div>
  </div>
</template>

<script>
import { codeLogin, getMsgCode, getPicCode } from '@/api/login'
export default {
  name: 'LoginPage',
  data () {
    return {
      picCode: '', // 用户输入的图形验证码
      picKey: '', // 将来请求传递的图形验证码的唯一标识
      picUrl: '', // 存储请求渲染的图片地址
      totalSecond: 60, // 总秒数
      currentSecond: 60, // 当前秒速，开定时器时 currentSecond--
      timer: null, // 定时器 id
      mobile: '',
      msgCode: ''
    }
  },
  async created () {
    this.getPicCode()
  },
  methods: {
    async getPicCode () {
      const { data: { base64, key } } = await getPicCode()
      this.picUrl = base64 // 存储地址
      this.picKey = key // 存储唯一标识

      // 获取图形验证码成功
      // this.$toast('获取成功')
    },

    // 校验 手机号 和 图形验证码 是否合法
    // 通过校验，返回 true
    // 不通过校验，返回 false
    validFn () {
      // if (!/^1[3-9]\d{9}$/.test(this.mobile)) {
      //   this.$toast('请输入正确的手机号')
      //   return false
      // }

      // if (!/^\w{4}$/.test(this.picCode)) {
      //   this.$toast('请输入正确的图形验证码')
      //   return false
      // }
      // return true
      return true
    },

    // 获取短信验证码
    async getCode () {
      if (!this.validFn()) {
        return
      }

      // 发送请求 (预期：希望如果响应的 status非 200，最好抛出一个 promise错误，await只会等待成功的 promise)
      const res = await getMsgCode(this.picCode, this.picKey, this.mobile)
      this.$toast('短信发送成功，请查收')
      console.log(res)

      if (!this.timer && this.currentSecond === this.totalSecond) {
        // 开启倒计时
        this.timer = setInterval(() => {
          this.currentSecond--

          if (this.currentSecond < 1) {
            clearInterval(this.timer) // 关闭定时器
            this.timer = null // 清空定时器
            this.currentSecond = this.totalSecond // 归位
          }
        }, 1000)
      }
    },

    async login () {
      if (!this.validFn) {
        return
      }

      // if (
      //   !/^\d{6}$/.test(this.msgCode)) {
      //   this.$toast('请输入正确的短信验证码')
      //   return
      // }

      // 只能传这个手机号 ......
      const res = await codeLogin('15751776629', 246810)
      this.$store.commit('user/setUserInfo', res.data)

      this.$toast('登录成功')

      // 进行判断，看地址栏有无回跳地址
      // 如果有 =>说明是其他页面，拦截到登录来的，需要回跳
      // 如果没有 => 正常去首页
      const url = this.$route.query.backUrl || '/'
      this.$router.replace(url)
    }
  },
  // 离开页面后,清除定时器
  destroyed () {
    clearInterval(this.timer)
  }
}
</script>

<style lang="less" scoped>
.container {
  padding: 49px 29px;

  .title {
    margin-bottom: 20px;
    h3 {
      font-size: 26px;
      font-weight: normal;
    }
    p {
      line-height: 40px;
      font-size: 14px;
      color: #b8b8b8;
    }
  }

  .form-item {
    border-bottom: 1px solid #f3f1f2;
    padding: 8px;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    .inp {
      display: block;
      border: none;
      outline: none;
      height: 32px;
      font-size: 14px;
      flex: 1;
    }
    img {
      width: 94px;
      height: 31px;
    }
    button {
      height: 31px;
      border: none;
      font-size: 13px;
      color: #cea26a;
      background-color: transparent;
      padding-right: 9px;
    }
  }

  .login-btn {
    width: 100%;
    height: 42px;
    margin-top: 39px;
    background: linear-gradient(90deg,#ecb53c,#ff9211);
    color: #fff;
    border-radius: 39px;
    box-shadow: 0 10px 20px 0 rgba(0,0,0,.1);
    letter-spacing: 2px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
</style>
