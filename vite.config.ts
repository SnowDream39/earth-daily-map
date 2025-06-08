import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cesium from 'vite-plugin-cesium'
import unocss from 'unocss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), cesium(), unocss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/news/charts': {
        target: 'http://localhost:8000', // FastAPI 运行的地址
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/news\/charts/, '/news/charts'),
      },
    },
  },
})
