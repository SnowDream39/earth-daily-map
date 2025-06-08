<template>
  <div>
    <h3>导出地图图片</h3>

    <div>
      <label>选择底图类型: </label>
      <select v-model="selectedBasemap">
        <option v-for="opt in basemapOptions" :key="opt.name" :value="opt.name">
          {{ opt.title }}
        </option>
      </select>
    </div>

    <button @click="exportMap" :disabled="loading">
      {{ loading ? '导出中...' : '导出当前视图' }}
    </button>

    <div v-if="error" style="color: red; margin-top: 10px;">{{ error }}</div>

    <div v-if="exportedImage" style="margin-top: 15px;">
      <h4>导出图片预览</h4>
      <img :src="`data:image/png;base64,${exportedImage}`" alt="导出地图" style="max-width: 100%;" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineProps } from 'vue'
import axios from 'axios'

// 这两个函数要根据你实际路径调整导入
import { loadNewsData } from '@/stores/article'
import { preparePointsFromArticles } from '@/stores/export'

const props = defineProps<{
  centerLat: number
  centerLng: number
  zoom: number
  width?: number
  height?: number
}>()

// 你可根据项目需求添加更多图层
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
    const points = preparePointsFromArticles(articles)

    // 3. 构造请求数据
    const postData = {
      center_lat: props.centerLat,
      center_lng: props.centerLng,
      zoom: props.zoom,
      width: props.width || 1024,
      height: props.height || 768,
      points,
      basemap_type: selectedBasemap.value,
    }

    // 4. 调用后端导出接口
    const res = await axios.post('/export', postData)
    if (res.data.success) {
      exportedImage.value = res.data.image_base64
    } else {
      error.value = res.data.message || '导出失败'
    }
  } catch (err: any) {
    error.value = err.response?.data?.detail ?? err.message ?? '未知错误'
  } finally {
    loading.value = false
  }
}
</script>