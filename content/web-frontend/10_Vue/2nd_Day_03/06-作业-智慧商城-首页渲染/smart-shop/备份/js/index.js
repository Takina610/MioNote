// 接口地址：http://cba.itlike.com/public/index.php?s=/api/page/detail
// 请求方式：get

// swiper初始化代码（思考：在Vue中应该在哪里初始化）
const mySwiper = new Swiper(".swiper", {
  speed: 1000,
  loop: true,
  autoplay: {
    disableOnInteraction: false,
    delay: 2000,
  },
  pagination: {
    el: ".swiper-pagination",
  },
  centeredSlides: true,
  observer: true, //修改swiper自己或子元素时，自动初始化swiper
  observeParents: true, //修改swiper的父元素时，自动初始化swiper
  observerUpdate: true,
});


// const app = new Vue({
//   el: '#app',
//   data: {
//     swiperList: [], // 轮播数据
//     navList: [], // 导航数据
//     goodsList: [] // 商品数据
//   },
//   created () {

//   },
//   mounted () {

//   }
// })