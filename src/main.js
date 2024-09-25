import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import { createHead } from '@vueuse/head'
import { auth0 } from './auth0';
import './css/tailwind.css'
import './css/style.css'
import './css/grid.css'
import './css/fonts.css'
import './css/palette.css'
import './css/colors.css'
import 'swiper/css' 

import App from './App.vue'

const head = createHead()
const pinia = createPinia();
const app = createApp(App)

app.use(auth0)
    .use(head)
    .use(pinia)
    .use(router)

app.provide('auth0', app.config.globalProperties.$auth0);

app.mount('#app')
