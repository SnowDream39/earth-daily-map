// stores/article.ts
import { defineStore } from 'pinia'

export const useArticleStore = defineStore('article', {
  state: () => ({
    current: null as any, // 用来保存一条新闻
  }),
  persist: true,
})
