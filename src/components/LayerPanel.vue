<template>
  <div class="layer-panel">
    <div class="panel-header">
      <h3>图层控制</h3>
      <button @click="togglePanel" class="toggle-btn">
        {{ isPanelVisible ? '−' : '+' }}
      </button>
    </div>
    
    <div v-show="isPanelVisible" class="panel-content">
      <!-- 图层切换区域 -->
      <div class="layer-section">
        <h4>底图图层</h4>
        <div class="layer-list">
          <div 
            v-for="(layer, key) in availableLayers" 
            :key="key"
            class="layer-item"
            :class="{ active: activeLayer === key }"
            @click="switchLayer(key)"
          >
            <div class="layer-icon"></div>
            <span class="layer-name">{{ layer.name }}</span>
            <div v-if="activeLayer === key" class="active-indicator">✓</div>
          </div>
        </div>
      </div>

      <!-- 新闻点控制区域 -->
      <div class="news-section">
        <h4>新闻点显示</h4>
        <div class="news-controls">
          <label class="checkbox-wrapper">
            <input 
              type="checkbox" 
              v-model="showNews" 
              @change="toggleNews"
            />
            <span>显示新闻点</span>
          </label>
        </div>
      </div>

      <!-- 地形控制 -->
      <div class="terrain-section">
        <h4>地形设置</h4>
        <label class="checkbox-wrapper">
          <input 
            type="checkbox" 
            v-model="terrainEnabled" 
            @change="toggleTerrain"
          />
          <span>启用地形</span>
        </label>
      </div>

      <!-- 操作按钮 -->
      <div class="action-section">
        <button @click="clearAllPoints" class="action-btn warning">
          🧹 清除所有点
        </button>
        <button @click="removeAllLayers" class="action-btn danger">
          🗑️ 清除所有图层
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useCesiumStore } from '@/stores/cesium'
import emitter from '@/utils/emitter'
import * as Cesium from 'cesium'

const cesiumStore = useCesiumStore()

// 面板状态
const isPanelVisible = ref(true)
const activeLayer = ref('Bing Maps Road')

// 新闻相关状态
const showNews = ref(false)

// 其他状态
const terrainEnabled = ref(true)

// 可用图层配置
const availableLayers = ref({
  'OpenStreetMap': {
    name: 'OpenStreetMap',
    type: 'OpenStreetMap'
  },
  
  'Gaode Vector': {
    name: '高德矢量地图',
    type: 'UrlTemplate',
    url: 'https://webrd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}'
  },
  'Gaode Satellite': {
    name: '高德卫星地图',
    type: 'UrlTemplate',
    url: 'https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}'
  }
})

// 存储当前图层实例的引用
let currentLayerProvider: any = null

// 方法
const togglePanel = () => {
  isPanelVisible.value = !isPanelVisible.value
}

const switchLayer = (layerKey: string) => {
  if (activeLayer.value === layerKey || !cesiumStore.viewer) return
  
  try {
    // 清除所有现有图层
    cesiumStore.viewer.imageryLayers.removeAll()
    
    // 销毁之前的图层提供者（如果存在）
    if (currentLayerProvider && typeof currentLayerProvider.destroy === 'function') {
      currentLayerProvider.destroy()
      currentLayerProvider = null
    }

    const layerConfig = availableLayers.value[layerKey]
    if (!layerConfig) {
      console.error('未找到图层配置:', layerKey)
      return
    }

    // 创建新的图层提供者
    let newProvider: any = null

    switch (layerConfig.type) {
      case 'Bing':
        newProvider = new Cesium.BingMapsImageryProvider({
          url: 'https://dev.virtualearth.net',
          key: 'AqTGBsziZHIJYYxgivLBf0hVdrAk9mWO5cQcb8Yux8sW5M8c8opEC2lZqKR1ZZXf',
          mapStyle: layerConfig.style
        })
        break
        
      case 'OpenStreetMap':
        newProvider = new Cesium.OpenStreetMapImageryProvider({
          url: 'https://a.tile.openstreetmap.org/'
        })
        break
        
      case 'ArcGIS':
        newProvider = new Cesium.ArcGisMapServerImageryProvider({
          url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
        })
        break
        
      case 'UrlTemplate':
        newProvider = new Cesium.UrlTemplateImageryProvider({
          url: layerConfig.url,
          maximumLevel: 18
        })
        break
        
      default:
        console.error('不支持的图层类型:', layerConfig.type)
        return
    }

    if (newProvider) {
      // 保存当前提供者的引用
      currentLayerProvider = newProvider
      
      // 添加新图层
      const newLayer = cesiumStore.viewer.imageryLayers.addImageryProvider(newProvider)
      newLayer.name = layerConfig.name
      
      // 更新活动图层
      activeLayer.value = layerKey
      
      console.log('成功切换到图层:', layerConfig.name)
      
      // 发送图层变化事件
      emitter.emit('layer-changed', layerConfig.name)
    }
    
  } catch (error) {
    console.error('切换图层时发生错误:', error)
    // 如果切换失败，尝试恢复到默认图层
    if (layerKey !== 'OpenStreetMap') {
      setTimeout(() => switchLayer('OpenStreetMap'), 100)
    }
  }
}

// 新闻相关控制方法
const toggleNews = () => {
  if (showNews.value) {
    emitter.emit('load-news')
  } else {
    // 清除所有新闻点
    emitter.emit('clear-news')
  }
}

// 地形控制
const toggleTerrain = () => {
  if (cesiumStore.viewer) {
    if (terrainEnabled.value) {
      cesiumStore.viewer.terrainProvider = Cesium.createWorldTerrain()
    } else {
      cesiumStore.viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider()
    }
  }
}

// 清除操作
const clearAllPoints = () => {
  if (!cesiumStore.viewer) return
  
  // 清除新闻点
  if (showNews.value) {
    showNews.value = false
    toggleNews()
  }
  
  // 清除其他实体点
  const entitiesToRemove = cesiumStore.viewer.entities.values.filter(entity => 
    entity.point && (!entity.properties || !entity.properties.hasProperty('keepAlive'))
  )
  
  entitiesToRemove.forEach(entity => {
    cesiumStore.viewer?.entities.remove(entity)
  })
  
  console.log('已清除所有点')
}

const removeAllLayers = () => {
  if (cesiumStore.viewer) {
    // 销毁当前图层提供者
    if (currentLayerProvider && typeof currentLayerProvider.destroy === 'function') {
      currentLayerProvider.destroy()
      currentLayerProvider = null
    }
    
    cesiumStore.viewer.imageryLayers.removeAll()
    activeLayer.value = ''
  }
  emitter.emit('remove-all-layers')
}

// 初始化默认图层
const initializeDefaultLayer = () => {
  if (cesiumStore.viewer && activeLayer.value) {
    setTimeout(() => {
      switchLayer(activeLayer.value)
    }, 500)
  }
}

// 监听事件
onMounted(() => {
  // 监听viewer初始化完成
  emitter.on('viewer-ready', () => {
    initializeDefaultLayer()
  })
  
  // 如果viewer已经存在，立即初始化
  if (cesiumStore.viewer) {
    initializeDefaultLayer()
  }
})

onUnmounted(() => {
  // 清理图层提供者
  if (currentLayerProvider && typeof currentLayerProvider.destroy === 'function') {
    currentLayerProvider.destroy()
    currentLayerProvider = null
  }
  
  // 清理事件监听器
  emitter.off('viewer-ready')
})
</script>

<style lang="scss" scoped>
.layer-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 320px;
  background: rgba(42, 42, 42, 0.95);
  border-radius: 10px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
  color: white;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  z-index: 1000;
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px 10px 0 0;
  
  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #ffffff;
  }
  
  .toggle-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    font-size: 18px;
    cursor: pointer;
    padding: 6px 10px;
    border-radius: 6px;
    transition: all 0.2s;
    
    &:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.05);
    }
  }
}

.panel-content {
  padding: 18px;
  max-height: 70vh;
  overflow-y: auto;
}

.layer-section, .news-section, .terrain-section, .action-section {
  margin-bottom: 24px;
  
  h4 {
    margin: 0 0 14px 0;
    font-size: 14px;
    font-weight: 500;
    color: #e8e8e8;
    border-bottom: 2px solid rgba(74, 144, 226, 0.3);
    padding-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
    
    &::before {
      content: '▶';
      font-size: 10px;
      color: #4a90e2;
    }
  }
}

.layer-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.layer-item {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid transparent;
  
  &:hover {
    background: rgba(255, 255, 255, 0.12);
    transform: translateX(2px);
  }
  
  &.active {
    background: rgba(74, 144, 226, 0.25);
    border: 1px solid #4a90e2;
    box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);
  }
  
  .layer-icon {
    width: 16px;
    height: 16px;
    border-radius: 4px;
    background: linear-gradient(45deg, #4a90e2, #357abd);
    margin-right: 12px;
  }
  
  .layer-name {
    flex: 1;
    font-size: 13px;
    font-weight: 500;
  }
  
  .active-indicator {
    color: #4a90e2;
    font-weight: bold;
  }
}

.news-controls {
  .checkbox-wrapper {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    cursor: pointer;
    
    input[type="checkbox"] {
      margin-right: 8px;
      accent-color: #4a90e2;
      width: 16px;
      height: 16px;
    }
    
    span {
      font-size: 13px;
    }
  }
}

.action-section {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  
  .action-btn {
    padding: 10px 16px;
    border-radius: 6px;
    border: none;
    color: white;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
    flex: 1;
    min-width: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
      transform: translateY(-2px);
    }
    
    &:active {
      transform: translateY(0);
    }
    
    &.warning {
      background: rgba(241, 196, 15, 0.2);
      border: 1px solid rgba(241, 196, 15, 0.3);
      
      &:hover {
        background: rgba(241, 196, 15, 0.4);
      }
    }
    
    &.danger {
      background: rgba(231, 76, 60, 0.2);
      border: 1px solid rgba(231, 76, 60, 0.3);
      
      &:hover {
        background: rgba(231, 76, 60, 0.4);
      }
    }
  }
}

// 滚动条样式
.panel-content {
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    
    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
}

// 媒体查询，适配小屏幕
@media (max-width: 768px) {
  .layer-panel {
    width: 280px;
    top: 10px;
    right: 10px;
  }
  
  .panel-header {
    padding: 12px 15px;
  }
  
  .panel-content {
    padding: 15px;
  }
  
  .action-btn {
    padding: 8px 12px;
    font-size: 12px;
  }
}
</style>