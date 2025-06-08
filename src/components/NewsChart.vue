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

const chartRef = ref<HTMLElement | null>(null)
const selectedCategory = ref('general')
const categories = ref<string[]>([])
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

// 加载数据并更新图表
const loadData = async () => {
  try {
    // 加载测试数据
    const newsData = await loadTestData(selectedCategory.value)
    
    // 调用后端的图表生成API
    const response = await axios.post('/news/charts/news-by-country', newsData)
    
    // 更新图表
    if (chartInstance) {
      chartInstance.setOption(response.data as EChartsOption)
    }
  } catch (error) {
    console.error('获取图表数据失败:', error)
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