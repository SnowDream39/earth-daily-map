<template>
  <div class="chart-panel" ref="draggablePanel">
    <div class="panel-header">
      <button @click="onLoadChart" :disabled="loading" class="load-chart-btn">
        {{ loading ? '加载中...' : '加载新闻图表' }}
      </button>
    </div>
    <div class="panel-content">
      <div v-if="error" class="error-message">
        <p>{{ error }}</p>
      </div>
      <div v-if="!error" ref="chartContainer" class="chart-container"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import * as echarts from 'echarts'
import { useChartStore } from '@/stores/charts'

const chartRef = ref<HTMLElement | null>(null)
const selectedCategory = ref('{category}')
const categories = ref<string[]>([])
const chartStore = useChartStore()

// 本地状态
const loading = ref(false)
const error = ref('')
const chartInstance = ref<echarts.ECharts | null>(null)
const chartContainer = ref<HTMLDivElement | null>(null)
const draggablePanel = ref<HTMLElement | null>(null)

// 加载图表数据
const onLoadChart = async () => {
  loading.value = true
  error.value = ''

  try {
    const isLoaded = await chartStore.loadChart()
    if (isLoaded) {
      await nextTick()
      renderChart()
    } else {
      error.value = '无法加载图表数据，请重试。'
    }
  } catch (e: any) {
    error.value = e.message || '加载图表时发生错误。'
  } finally {
    loading.value = false
  }
}

// 渲染图表
const renderChart = () => {
  const chartOptions = chartStore.chartOption
  if (!chartInstance.value && chartContainer.value) {
    chartInstance.value = echarts.init(chartContainer.value)
  }
  if (chartInstance.value && chartOptions) {
    chartInstance.value.setOption(chartOptions)
  }
}

// 拖拽功能
const enableDrag = () => {
  const el = draggablePanel.value
  if (!el) return

  let isDragging = false
  let offsetX = 0
  let offsetY = 0

  const onMouseDown = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    // 只允许通过 panel-header 拖动
    if (!target.classList.contains('panel-header')) return

    isDragging = true
    offsetX = e.clientX - el.offsetLeft
    offsetY = e.clientY - el.offsetTop
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const onMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      el.style.left = `${e.clientX - offsetX}px`
      el.style.top = `${e.clientY - offsetY}px`
    }
  }

  const onMouseUp = () => {
    isDragging = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  el.addEventListener('mousedown', onMouseDown)
}

onMounted(() => {
  enableDrag()
  window.addEventListener('resize', () => {
    if (chartInstance.value) {
      chartInstance.value.resize()
    }
  })
})
</script>

<style scoped>
.chart-panel {
  width: 100%;
  max-width: 600px;
  height: auto;
  margin: 0 auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  position: absolute;
  /* 必须使用 absolute 才能移动位置 */
  top: 100px;
  left: 100px;
  user-select: none;
  z-index: 1000;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: center;
  cursor: move;
  /* 鼠标拖动时的样式 */
  background-color: #f9f9f9;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.load-chart-btn {
  padding: 8px 16px;
  background: #2196f3;
  color: #fff;
  border: none;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.load-chart-btn:disabled {
  background: #90caf9;
}

.panel-content {
  padding: 16px;
}

.chart-container {
  height: 400px;
}

.error-message {
  color: #e74c3c;
  text-align: center;
  margin: 16px 0;
}
</style>
