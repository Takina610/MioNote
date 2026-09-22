<template>
  <div class="main">
      <ShopMainBaseSec></ShopMainBaseSec>
      <!-- ============================= 新品首发 End =================================== -->

      <section class="section2">
        <a href="javascript:;">
          <img src="http://cba.itlike.com/public/uploads/10001/20230320/647c6bde4b1f1a3e88955e5f596344f9.png" alt="" />
        </a>
      </section>
      
      <section class="section3">
        <h2>——&nbsp;&nbsp;猜你喜欢&nbsp;&nbsp;——</h2>

        <!-- ============================= 商品组 Start =================================== -->
        <ul class="section3Ul">
          <ShopMainBaseSec1 v-for="item in 5" :key="item"></ShopMainBaseSec1>
        </ul>
        <!-- ============================= 商品组 Start =================================== -->
      </section>
    </div>
</template>

<script>
export default {

}
</script>

<style>
.main {
  padding-bottom: 50px;
}
.main .section2 img {
  width: 100%;
}
.main .section3 h2 {
  background-color: #fff;
  line-height: 8vw;
  text-align: center;
  padding: 1.3333vw 0;
  font-size: 3.7333vw;
  font-weight: normal;
  margin-bottom: 0.5333vw;
}
.main .section3 ul li {
  padding: 10px;
  margin-bottom: 1.6vw;
  background-color: #fff;
}
.main .section3 ul li a {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.main .section3 ul li a img {
  width: 32vw;
}
.main .section3 ul li a .goodCont {
  width: 60%;
}
.main .section3 ul li a .goodCont h3 {
  margin-top: 2.6667vw;
  min-height: 9.0667vw;
  line-height: 1.3;
  white-space: normal;
  color: #484848;
  font-size: 3.4667vw;
  font-weight: normal;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.main .section3 ul li a .goodCont .selled {
  color: #999;
  font-size: 3.2vw;
  margin: 1.0667vw 0;
}
.main .section3 ul li a .goodCont .price {
  margin-right: 2.1333vw;
  color: #f03c3c;
  font-size: 4vw;
}
.main .section3 ul li a .goodCont .price span {
  color: #999;
  text-decoration: line-through;
}
</style>