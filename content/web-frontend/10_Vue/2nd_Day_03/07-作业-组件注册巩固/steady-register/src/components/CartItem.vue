<template>
  <tr class="row" >
        <td><input type="checkbox" name="" class="choose"></td>
        <td class="tal"><a href="#" class="pic"><img src="http://cba.itlike.com/public/uploads/10001/20230321/39b505c2205b69a8ad91601290c5ac65.jpg" alt=""></a>
        </td>
        <td class="tal"><a href="#">艾美特(Airmate) 电风扇 五叶大风量4档遥控控制家用电扇空调伴侣 FS4056R-5</a></td>
        <td>
          <del class="tdl">158.00</del>
          <br>
          <b class="unit">129.00</b>
        </td>
        <td>
          <!-- 数字框 -->
          <NumberBox></NumberBox>
        </td>
        <td><b class="u-price">129.00</b></td>
        <td><a href="#" class="btn-del">删除</a></td>
      </tr>
</template>

<script>
export default {

}
</script>

<style>
.cartTable tr.title {
  background-color: rgb(241, 243, 244);
  font-weight: bold;
}

.cartTable tbody tr td {
  /* border: 1px solid rgb(245, 245, 245); */
  padding: 10px;
}

/* 原价 */
.cartTable tbody tr td .tdl {
  text-decoration: line-through;
  color: #999;
}

.cartTable tr.count .jiesuan .right {
  text-align: right;

}

.cartTable tr.count .jiesuan .right p {
  margin: 5px 0;
}

.cartTable tr.count .jiesuan .right .pay {
  display: block;
  width: 160px;
  height: 50px;
  line-height: 50px;
  background-color: #f30213;
  color: #fff;
  font-weight: bold;
  text-align: center;
  font-size: 20px;
}

.row img {
  width: 100px;
  height: 100px;
}
</style>