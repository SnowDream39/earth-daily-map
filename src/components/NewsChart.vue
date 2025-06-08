<template>
  <div class="chart-container">
    <div class="controls">
      <select v-model="selectedCategory" @change="loadData">
        <option v-for="category in categories" 
                :key="category" 
                :value="category">
          {{ category.charAt(0).toUpperCase() + category.slice(1) }}
        </option>
      </select>
    </div>
    <div ref="chartRef" style="width: 100%; height: 400px;"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import axios from 'axios'
import { loadTestData, getAvailableCategories } from '@/utils/testData'
import { useChartStore } from '@/stores/charts'
import { loadNewsData } from '@/stores/article' 

const chartRef = ref<HTMLElement | null>(null)
const selectedCategory = ref('{category}')
const categories = ref<string[]>([])
const chartStore = useChartStore()
let chartInstance: echarts.ECharts | null = null

// 初始化图表
const initChart = () => {
  if (chartRef.value) {
    chartInstance = echarts.init(chartRef.value)
  }
}

// 加载类别列表
const loadCategories = async () => {
  categories.value = await getAvailableCategories()
  if (categories.value.length > 0 && !categories.value.includes(selectedCategory.value)) {
    selectedCategory.value = categories.value[0]
  }
}

const loadData = async () => {
  try {
    const newsItems = await loadNewsData(selectedCategory.value)
    await chartStore.fetchChartData(newsItems)
  } catch (e) {
    console.error(e)
  }
}

// 处理窗口大小变化
const handleResize = () => {
  chartInstance?.resize()
}

onMounted(async () => {
  await loadCategories()
  initChart()
  loadData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  chartInstance?.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.chart-container {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.controls {
  margin-bottom: 20px;
}

select {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}
</style>