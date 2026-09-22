<template>
  <footer>
      <a href="javascript:;" class="cur">
        <i class="iconfont icon-shouye"></i>
        <p>首页</p>
      </a>
      <a href="javascript:;">
        <i class="iconfont icon-fenlei"></i>
        <p>分类</p>
      </a>
      <a href="javascript:;">
        <i class="iconfont icon-gouwuche"></i>
        <p>购物车</p>
      </a>
      <a href="javascript:;">
        <i class="iconfont icon-wode"></i>
        <p>我的</p>
      </a>
  </footer>
</template>

<script>
export default {

}
</script>

<style>
footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 13.0667vw;
  background-color: #fff;
  padding: 2.1333vw 0;
}
footer a {
  width: 20%;
  text-align: center;
  color: #7d7d7d;
}
footer a.iconfont {
  font-size: 5.0667vw;
  color: red;
}
footer a.cur {
  color: red;
}
footer a p {
  font-size: 3.2vw;
}
</style>