import { createApp } from 'vue';
import App from './App.vue';

import './style/common.css'

import ShopMainBaseSec from './components/ShopMainBaseSec.vue';
import ShopMainBaseSec1 from './components/ShopMainBaseSec1.vue';

const app = createApp(App);

app.component('ShopMainBaseSec', ShopMainBaseSec);
app.component('ShopMainBaseSec1', ShopMainBaseSec1);

app.mount('#app');
