import './assets/main.css'
import '@unocss/reset/tailwind.css'
import 'virtual:uno.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

import live2d from '@snowdream39/live2d-widget'
import '@snowdream39/live2d-widget/index.css'
import '@snowdream39/live2d-widget/style.css'
app.use(live2d)

import * as ElementPlusIconsVue from '@element-plus/icons-vue'
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')
