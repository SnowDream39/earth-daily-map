<template>
  <div class="bg-paper w-64 p-6 space-y-4 transition-all">
    <h3 class="text-xl font-bold">🗺️ 导出地图图片</h3>

    <!-- 选择底图 -->
    <div class="space-y-1">
      <label class="block text-sm font-medium">选择底图类型：</label>
      <select v-model="selectedBasemap"
        class="w-full px-3 py-2 border rounded bg-white dark:bg-gray-900! dark:text-white! border-gray-300 dark:border-cyan-400! focus:outline-none focus:ring-2 focus:ring-blue-400! dark:focus:ring-cyan-400!">
        <option v-for="opt in basemapOptions" :key="opt.name" :value="opt.name">
          {{ opt.title }}
        </option>
      </select>
    </div>

    <!-- 导出按钮 -->
    <button @click="exportMap" :disabled="loading"
      class="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition">
      {{ loading ? '导出中...' : '📤 导出当前视图' }}
    </button>

    <!-- 错误信息 -->
    <div v-if="error" class="text-red-500 text-sm">
      ⚠️ {{ error }}
    </div>

    <!-- 导出图片预览 -->
    <div v-if="exportedImage" class="space-y-2">
      <h4 class="text-lg font-semibold">📷 导出图片预览</h4>
      <img :src="`data:image/png;base64,${exportedImage}`" alt="导出地图"
        class="w-full rounded border border-gray-200 dark:border-cyan-400 shadow" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { defineProps } from 'vue'
import { loadNewsData } from '@/stores/article'
import { exportMap as exportMapApi } from '@/stores/export' // 修改导入名以避免冲突
import axios from 'axios'

const props = defineProps<{
  centerLat: number
  centerLng: number
  zoom: number
  width?: number
  height?: number
}>()

// 可根据项目需求添加更多图层
const availableLayers = ref({
  'OpenStreetMap': { name: 'OpenStreetMap', type: 'OpenStreetMap' },
  'Gaode Vector': {
    name: '高德矢量地图',
    type: 'UrlTemplate',
    url: 'https://webrd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
  },
  'Gaode Satellite': {
    name: '高德卫星地图',
    type: 'UrlTemplate',
    url: 'https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
  }
})

// 动态生成底图选项数组
const basemapOptions = computed(() =>
  Object.entries(availableLayers.value).map(([key, layer]) => ({
    name: key,
    title: layer.name,
  }))
)

const selectedBasemap = ref(basemapOptions.value[0]?.name || 'OpenStreetMap')

const loading = ref(false)
const error = ref<string | null>(null)
const exportedImage = ref<string | null>(null)

async function exportMap() {
  error.value = null
  loading.value = true
  exportedImage.value = null

  try {
    // 1. 根据当前参数加载新闻
    const articles = await loadNewsData()

    // 2. 从新闻转换点数据
    const points = articles.map(article => ({
      title: article.title,
      description: article.description,
      location: article.location,
      url: article.url,
      publishedAt: article.publishedAt,
    }))

    // 3. 构造请求数据
    const postData = {
      center_lat: props.centerLat,
      center_lng: props.centerLng,
      zoom: props.zoom,
      width: props.width || 1024,
      height: props.height || 768,
      articles: points, // 使用 articles 替代 points
      basemap_type: selectedBasemap.value,
    }

    // 4. 调用后端导出接口
    const res = await exportMapApi(postData) // 使用导入的 API 函数
    if (res.success) {
      exportedImage.value = res.image_base64 ?? null
    } else {
      error.value = res.message || '导出失败'
    }
  } catch (err: any) {
    error.value = err.response?.data?.detail ?? err.message ?? '未知错误'
  } finally {
    loading.value = false
  }
}
</script>