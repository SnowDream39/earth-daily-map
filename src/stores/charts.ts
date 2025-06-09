import { defineStore } from 'pinia'
import axios from 'axios'

export const useChartStore = defineStore('chart', {
  state: () => ({
    chartOption: {} as any,
  }),
  actions: {
    async loadChart(): Promise<boolean> {
      try {
        const response = await axios.get('http://8.209.210.116:7000/news/charts/news-by-country')
        this.chartOption = response.data
        return true
      } catch (error) {
        console.error('获取图表数据失败:', error)
        return false
      }
    },
  },
})
