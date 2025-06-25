import './assets/main.css'
import '@unocss/reset/tailwind.css'
import 'virtual:uno.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import App from './App.vue'
import router from './router'

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.use(router)

import live2d from '@snowdream39/live2d-widget'
import '@snowdream39/live2d-widget/index.css'
import '@snowdream39/live2d-widget/style.css'
app.use(live2d)

app.mount('#app')
