import { defineStore } from 'pinia'

export const useStatusStore = defineStore('board', {
  state: () => ({
    articleId: 'news',
    userName: '',
    userId: 0,
    isSuperUser: false,
  }),
})
