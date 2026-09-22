<template>
  <div class="search">
      <a href="javascript:;" class="searchCont">
        <i class="iconfont icon-sousuo"></i>
        <p>搜索商品</p>
      </a>
  </div>
</template>

<script>
export default {

}
</script>

<style>
.search {
  padding: 2.6667vw;
  background-color: #fff;
  height: 13.3333vw;
  width: 100%;
  left: 0;
  top: 11.7333vw;
  z-index: 999;
  position: fixed;
}
.search .searchCont {
  width: 100%;
  background-color: #f1f1f2;
  border-radius: 13vw;
  display: flex;
  align-items: center;
  justify-content: space-between;
  justify-content: center;
}
.search .searchCont i {
  font-size: 3.7333vw;
}
.search .searchCont p {
  font-size: 3.7333vw;
  height: 8vw;
  line-height: 8vw;
  color: #999;
}
</style>