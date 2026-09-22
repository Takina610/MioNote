<template>
  <div class="wrap clearfix">
    <div class="location">当前位置：首页 <span>&nbsp;&gt;&nbsp;</span><b class="red"> 购物车</b></div>
    <table width="100%" class="cartTable" cellspacing="0" cellpadding="10px">
      <!-- 首行 -->
      <tr class="title">
        <td width="50"><input type="checkbox" name="" class="choose_all"></td>
        <td width="100" class=""><span style="margin-left: -10px;">全选</span></td>
        <td width="400">商品信息</td>
        <td width="150">单价（元）</td>
        <td width="150">数量</td>
        <td width="150">金额（元）</td>
        <td width="80">操作</td>
      </tr>

      <!-- 商品 -->
      <CartItem v-for="n in 4" :key="n"></CartItem>

      <tr class="count">
        <td colspan="7">
          <div class="jiesuan clearfix">
            <div class="left fl">
              <p><input type="checkbox" name="" class="choose_all"> 全选&nbsp;&nbsp;&nbsp;<a href="#" class="del_check">删除选中商品</a></p>
            </div>
            <div class="right fr clearfix">
              <p>商品总计：￥465.00</p>
              <p>活动优惠：-￥0.00</p>
              <p>已选商品<span class="red t-number"> 0 </span>件 总价(不含运费、税费)：<span class="red t-price">￥0.00</span></p>
              <!-- <div><a href="#" class="btn pay">结算</a></div> -->
              <a href="#" class="btn pay fr">结算</a>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>
</template>

<script>
import CartItem from './components/CartItem.vue'

export default {
  components: {
    CartItem,

  }
}
</script>

<style>
/* 公共样式 */
.clearfix {
  content: '';
  display: block;
  clear: both;
}

.red {
  color: #f30213;
}

.fl {
  float: left;
}

.fr {
  float: right;
}

/* 清除默认样式 */
* {
  margin: 0px;
  padding: 0px;
  font-size: 14px;
}

a {
  text-decoration: none;
  color: #333;
}

table {
  padding: 10px;
}

input {
  outline: none;
}

.wrap {
  width: 1180px;
  margin: 0 auto;
}

.wrap .location {
  padding: 10px 0;
  border-bottom: 1px solid #ccc;
  margin-bottom: 20px;
}

.title {
  height: 40px;
  line-height: 40px;
}

.cartTable {
  border: 1px solid #ccc;
}

</style>