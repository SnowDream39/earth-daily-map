import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('../views/MapView.vue'),
    },
    {
      path: '/article',
      component: () => import('../views/ArticleView.vue'),
    },
    { path: '/user', component: () => import('../views/UserView.vue') },
  ],
})

export default router
