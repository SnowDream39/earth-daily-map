import { defineStore } from 'pinia'
import axios from 'axios'
import type { Article } from '@/types/news'

export const useChartStore = defineStore('chart', {
  state: () => ({
    chartData: null as any,
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchChartData(newsItems: Article[]) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.post('http://localhost:8000/news/charts/news-by-country', newsItems)
        this.chartData = response.data
      } catch (error) {
        this.error = '获取图表数据失败'
        console.error(error)
      } finally {
        this.loading = false
      }
    },
  },
})