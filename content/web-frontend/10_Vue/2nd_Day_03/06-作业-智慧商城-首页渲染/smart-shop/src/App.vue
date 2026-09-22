<template>
  <div class="App">
    <ShopHeader></ShopHeader>
    <ShopSearch></ShopSearch>
    <ShopBanner></ShopBanner>
    <ShopAd></ShopAd>
    <ShopMain></ShopMain>
    <ShopFooter></ShopFooter>
  </div>
</template>

<script>
import ShopHeader from './components/ShopHeader.vue'
import ShopSearch from './components/ShopSearch.vue'
import ShopBanner from './components/ShopBanner.vue'
import ShopAd from './components/ShopAd.vue'
import ShopMain from './components/ShopMain.vue'
import ShopFooter from './components/ShopFooter.vue'

export default {
  components: {
    ShopHeader,
    ShopSearch,
    ShopBanner,
    ShopAd,
    ShopMain,
    ShopFooter
  }
}
</script>

<style>
.App {
  padding-top: 23.4666vw;
}
</style>