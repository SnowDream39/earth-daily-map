import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/MapView.vue'),
    },
    {
      path: '/article',
      name: 'article',
      component: () => import('../views/ArticleView.vue'),
    },
  ],
})

export default router
