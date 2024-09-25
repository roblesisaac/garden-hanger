import { createApp } from 'vue';
import { createAuth0 } from '@auth0/auth0-vue';
import { createPinia } from 'pinia';
import router from './router';
import { createHead } from '@vueuse/head'
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

const auth0Domain = 'my-domain';

const auth0 = createAuth0({
  domain: auth0Domain,
  clientId: 'my-id',
  authorizationParams: {
    redirect_uri: window.location.origin,
    // audience: `${auth0Domain}/api/v2/`,
    scope: 'openid profile email offline_access'
  },
  cacheLocation: 'memory',
  useRefreshTokens: true,
  httpTimeoutInSeconds: 60
});

app.use(auth0)
    .use(head)
    .use(pinia)
    .use(router)

app.mount('#app')
