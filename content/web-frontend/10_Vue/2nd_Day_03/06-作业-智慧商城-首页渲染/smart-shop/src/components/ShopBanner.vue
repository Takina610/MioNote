<template>
  <div class="banner">
    <div class="swiper">
      <div class="swiper-wrapper">
        <div class="swiper-slide">
          <a href="#">
            <img src="../assets/img/20231025192204_1.jpg" alt="" />
          </a>
        </div>
        <div class="swiper-slide">
          <a href="#">
            <img src="../assets/img/20231025192724_1.jpg" alt="" />
          </a>
        </div>
        <div class="swiper-slide">
          <a href="#">
            <img src="../assets/img/20231029161656_1.jpg" alt="" />
          </a>
        </div>
      </div>
      <div class="swiper-pagination"></div>
    </div>
  </div>
</template>

<script>
import Swiper, { Autoplay, Pagination } from 'swiper';
// 导入Swiper CSS
import 'swiper/css';
// import 'swiper/swiper-bundle.css';
// 导入需要的模块样式
import 'swiper/css/pagination';
import 'swiper/css/autoplay';

export default {
  name: 'ShopBanner',
  mounted() {
    // 确保Swiper插件功能启用
    Swiper.use([Autoplay, Pagination]);
    new Swiper('.swiper', {
      speed: 1000,
      loop: true,
      autoplay: {
        disableOnInteraction: false,
        delay: 2000,
      },
      pagination: {
        el: '.swiper-pagination',
      },
      centeredSlides: true,
      observer: true,
      observeParents: true,
      observerUpdate: true,
    });
  }
};
</script>

<style>
/* Swiper样式 */
.banner {
  position: relative;
}
.banner .swiper {
  width: 100vw;
  overflow: hidden;
  height: 49.0667vw;
}
.banner .swiper .swiper-wrapper img {
  height: 100%;
}
.banner .swiper .swiper-pagination-bullets .swiper-pagination-bullet {
  border-radius: 1.6vw;
  opacity: 1;
  width: 1.6vw;
  height: 1.6vw;
  background-color: #fff;
}
.banner .swiper .swiper-pagination-bullets .swiper-pagination-bullet-active {
  width: 2.9333vw;
  height: 1.3333vw;
  background-color: #8ed6ee;
}
</style>
