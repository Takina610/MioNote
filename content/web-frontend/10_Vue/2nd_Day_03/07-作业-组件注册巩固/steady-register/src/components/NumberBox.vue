<template>
  <div class="amount">
    <a href="#" class="Increase">+</a>
    <input type="text" value="1" class="unum">
    <a href="#" class="Reduce">-</a>
  </div>
</template>

<script>
export default {
  
}
</script>

<style>
/* 商品数量 */
.cartTable tr .amount .unum {
  width: 70px;
  height: 30px;
  box-sizing: border-box;
  text-align: center;
  font-size: 16px;
  float: left;
}

/* 数量加减按钮 */
.cartTable tr .amount a {
  display: block;
  width: 30px;
  height: 30px;
  line-height: 30px;
  text-align: center;
  font-size: 18px;
  border: 1px solid #ccc;
  box-sizing: border-box;
}

.cartTable tr .amount a.Increase {
  border-right: none;
  float: left;
}

.cartTable tr .amount a.Reduce {
  border-left: none;
  float: left;
}
</style>