<template>
  <div class="cesium-container">
    <!-- 筛选面板 -->
    <div class="filter-form" style="margin-bottom: 16px;">
      <label>
        开始时间：
        <input type="date" v-model="filters.startTime" />
      </label>

      <label style="margin-left: 12px;">
        结束时间：
        <input type="date" v-model="filters.endTime" />
      </label>

      <label style="margin-left: 12px;">
        类别名称：
        <select v-model="filters.category">
          <option value="">全部</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </label>
    </div>

    <!-- 地图容器 -->
    <div ref="mapRef" class="cesium-viewer"></div>

    <!-- 组件面板 -->
    <LayerPanel />

    <!-- 城市加载状态提示 -->
    <div v-if="cityLoadingStatus.isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">{{ cityLoadingStatus.message }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, reactive, watch } from "vue";
import { useCesiumStore } from "@/stores/cesium";
import LayerPanel from "./LayerPanel.vue";
import * as Cesium from "cesium";
import emitter from "@/utils/emitter";
import axios from "axios";
import { loadNewsData } from "@/stores/article";
import type { LocationItem, Source, Article, CityData } from "@/types/news";
const categories = [
  'technology', 'sports', 'entertainment',
  'general', 'health', 'science'
];
const filters = reactive({
  startTime: '',
  endTime: '',
  category: '',
});

const cesiumStore = useCesiumStore();
const emit = defineEmits(['update']);
const mapRef = ref<HTMLDivElement | null>(null);
let viewer: Cesium.Viewer | null = null;

// 新闻点偏移配置
const OFFSET_RADIUS_METERS = 30;

// 城市加载状态
const cityLoadingStatus = reactive({
  isLoading: false,
  message: ''
});

// 新闻加载状态
const newsLoadingStatus = reactive({
  isLoading: false,
  message: ''
});

// 新闻点偏移公式，防止点重叠
function offsetLocation(lat: number, lng: number, radiusInMeters: number): LocationItem {
  const meterToDegreeLat = radiusInMeters / 111000
  const meterToDegreeLng = radiusInMeters / (111000 * Math.cos(lat * Math.PI / 180))
  const angle = Math.random() * 2 * Math.PI
  return {
    lat: lat + meterToDegreeLat * Math.sin(angle),
    lng: lng + meterToDegreeLng * Math.cos(angle),
  }
}

// 生成新闻描述信息
function generateNewsDescription(article: Article, category?: string): string {
  return `
    <div style="font-family: Microsoft YaHei; max-width: 400px;">
      <h3 style="margin: 0 0 12px 0; color: #c0392b; font-size: 16px; line-height: 1.4;">
        ${article.title}
      </h3>
      
      <div style="margin-bottom: 12px; line-height: 1.6; color: #2c3e50;">
        ${article.description}
      </div>
      
      <div style="margin: 12px 0; padding: 8px 0; border-top: 1px solid #eee; border-bottom: 1px solid #eee;">
        <div style="display: flex; flex-wrap: wrap; gap: 15px; font-size: 12px; color: #7f8c8d;">
          ${article.source ? `<span><strong>来源:</strong> ${article.source}</span>` : ''}
          ${category ? `<span><strong>分类:</strong> ${category}</span>` : ''}
          ${article.publishedAt ? `<span><strong>时间:</strong> ${new Date(article.publishedAt).toLocaleString('zh-CN')}</span>` : ''}
        </div>
      </div>
      
      <div style="margin-top: 15px;">
        <a href="${article.url}" 
           target="_blank" 
           style="color: #3498db; text-decoration: none; font-weight: 500;">
          📰 阅读完整新闻
        </a>
      </div>
    </div>
  `;
}//数据中无category,要显示的话后面由筛选传入

// 渲染新闻点功能
async function renderNewsArticles(
  category?: string,
  startTime?: string,
  endTime?: string,
) {
  if (!viewer) {
    console.warn('Cesium viewer 未初始化');
    return;
  }

  newsLoadingStatus.isLoading = true;
  newsLoadingStatus.message = '正在加载新闻数据...';

  try {
    const articles = await loadNewsData(category, startTime, endTime);

    if (!Array.isArray(articles) || articles.length === 0) {
      throw new Error('新闻数据为空');
    }

    newsLoadingStatus.message = `正在渲染 ${articles.length} 条新闻...`;

    // 清除现有的新闻点
    const newsEntitiesToRemove: Cesium.Entity[] = [];
    viewer.entities.values.forEach(entity => {
      if (entity.properties && entity.properties.hasProperty('articleId')) {
        newsEntitiesToRemove.push(entity);
      }
    });

    console.log(`清除现有新闻点: ${newsEntitiesToRemove.length} 个`);
    newsEntitiesToRemove.forEach(entity => {
      viewer?.entities.remove(entity);
    });

    // 统计相同坐标的新闻数量
    const locCount = new Map<string, number>();
    const locIndex = new Map<string, number>();

    articles.forEach(article => {
      article.location.forEach(loc => {
        const key = `${loc.lat.toFixed(6)},${loc.lng.toFixed(6)}`;
        locCount.set(key, (locCount.get(key) || 0) + 1);
      });
    });

    let addedCount = 0;

    // 添加新闻实体，带偏移
    articles.forEach(article => {
      article.location.forEach(loc => {
        const key = `${loc.lat.toFixed(6)},${loc.lng.toFixed(6)}`;
        const count = locCount.get(key) ?? 1;
        let pos = loc;

        if (count > 1) {
          const idx = locIndex.get(key) ?? 0;
          locIndex.set(key, idx + 1);
          pos = offsetLocation(loc.lat, loc.lng, OFFSET_RADIUS_METERS);
        }

        // 根据新闻类别选择不同颜色
        const color = getNewsColor(category);

        const entity = viewer?.entities.add({
          name: `新闻: ${article.title}`,
          position: Cesium.Cartesian3.fromDegrees(pos.lng, pos.lat),
          point: {
            pixelSize: 12,
            color: color,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            scaleByDistance: new Cesium.NearFarScalar(1000, 1.2, 10000000, 0.4),
            disableDepthTestDistance: 0,  // 禁用深度测试
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, Number.POSITIVE_INFINITY)
            //disableDepthTestDistance: Number.POSITIVE_INFINITY
          },
          label: {
            text: article.title.length > 20 ? article.title.substring(0, 20) + '...' : article.title,
            font: '11pt Microsoft YaHei',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -20),
            show: false, // 默认不显示标签
            scaleByDistance: new Cesium.NearFarScalar(1000, 1.0, 5000000, 0.0),
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          },
          description: generateNewsDescription(article),
          show: true
        });

        // 添加新闻相关的自定义属性
        if (entity) {
          entity.addProperty('articleId', article.id);
          entity.addProperty('newsTitle', article.title);
          entity.addProperty('newsUrl', article.url);
          entity.addProperty('newsCategory', article.category || '');
          entity.addProperty('newsSource', article.source || '');
          entity.addProperty('publishTime', article.publishedAt || '');
          addedCount++;
        }
      });
    });

    console.log(`新闻点渲染完成: ${addedCount} 个新闻点`);

    // 通知面板新闻数据已加载
    emitter.emit('news-loaded', addedCount);

  } catch (error) {
    console.error('加载新闻数据失败:', error);
    newsLoadingStatus.message = '加载失败: ' + (error as Error).message;
    setTimeout(() => {
      newsLoadingStatus.isLoading = false;
    }, 3000);
    emitter.emit('news-load-error', error);
    return;
  } finally {
    setTimeout(() => {
      newsLoadingStatus.isLoading = false;
    }, 1000);
  }
}

// 根据新闻类别获取颜色
function getNewsColor(category?: string): Cesium.Color {
  const colorMap: { [key: string]: Cesium.Color } = {
    'technology': Cesium.Color.BLUE,
    'sports': Cesium.Color.ORANGE,
    'entertainment': Cesium.Color.MAGENTA,
    'general': Cesium.Color.YELLOW,
    'health': Cesium.Color.FORESTGREEN,
    'science': Cesium.Color.PINK,
    'business': Cesium.Color.GOLD
  };

  return colorMap[category || ''] || Cesium.Color.CRIMSON;
}

//调用新闻数据加载
async function loadNewsData(
  category?: string,
  startTime?: string,
  endTime?: string
): Promise<Article[]> {
  const params = new URLSearchParams();
  if (category) params.append("category", category);
  if (startTime) params.append("start_time", startTime);
  if (endTime) params.append("end_time", endTime);

  const response = await fetch(`http://8.209.210.116:7000/news/locations/articles/with-location?${params.toString()}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "请求失败");
  }

  const data = await response.json();

  //data.articles已经是 Article 类型结构，直接返回即可
  return data.articles as Article[];
}

// 清除所有新闻点
function clearNewsPoints() {
  if (!viewer) return;

  const newsEntitiesToRemove: Cesium.Entity[] = [];
  viewer.entities.values.forEach(entity => {
    if (entity.properties && entity.properties.hasProperty('articleId')) {
      newsEntitiesToRemove.push(entity);
    }
  });

  newsEntitiesToRemove.forEach(entity => {
    viewer?.entities.remove(entity);
  });

  console.log(`已清除 ${newsEntitiesToRemove.length} 个新闻点`);
  emitter.emit('news-cleared');
}

// 显示/隐藏新闻标签
function toggleNewsLabels(show: boolean): void {
  if (!viewer) return;

  viewer.entities.values.forEach(entity => {
    if (entity.properties && entity.properties.hasProperty('articleId') && entity.label) {
      entity.label.show = new Cesium.ConstantProperty(show);
    }
  });

  console.log(`新闻标签${show ? '显示' : '隐藏'}`);
}

// 根据类别筛选新闻点
function filterNewsByCategory(category: string | null): void {
  if (!viewer) return;

  viewer.entities.values.forEach(entity => {
    if (entity.properties && entity.properties.hasProperty('articleId')) {
      const entityCategory = entity.properties.newsCategory?.getValue();

      if (category === null) {
        entity.show = true;
      } else {
        entity.show = entityCategory === category;
      }
    }
  });

  console.log(`筛选显示${category || '所有'}类别的新闻`);
}

// 解析坐标的辅助函数
function parseCoordinates(centerPoint: string): { longitude: number; latitude: number } | null {
  try {
    let longitude: number, latitude: number;

    if (centerPoint.includes(',')) {
      const parts = centerPoint.split(',').map(s => s.trim());
      if (parts.length !== 2) return null;
      longitude = parseFloat(parts[0]);
      latitude = parseFloat(parts[1]);
    } else if (centerPoint.includes(' ')) {
      const parts = centerPoint.split(' ').filter(s => s.trim());
      if (parts.length !== 2) return null;
      longitude = parseFloat(parts[0]);
      latitude = parseFloat(parts[1]);
    } else {
      return null;
    }

    if (isNaN(longitude) || isNaN(latitude)) return null;
    return { longitude, latitude };
  } catch (error) {
    return null;
  }
}

// 验证坐标有效性
function isValidCoordinate(longitude: number, latitude: number): boolean {
  return longitude >= 70 && longitude <= 140 &&
    latitude >= 0 && latitude <= 60;
}

// 根据城市级别获取点的大小
function getCityPointSize(level?: number): number {
  if (!level) return 8;
  switch (level) {
    case 1: return 12; // 直辖市/省会
    case 2: return 10; // 地级市
    case 3: return 8;  // 县级市
    default: return 6; // 其他
  }
}

// 获取城市级别文本
function getCityLevelText(level: number): string {
  const levelMap: { [key: number]: string } = {
    1: '直辖市/省会城市',
    2: '地级市',
    3: '县级市',
    4: '县城',
    5: '乡镇'
  };
  return levelMap[level] || '未知级别';
}

// 生成城市描述
function generateCityDescription(city: CityData): string {
  const coordinates = parseCoordinates(city.centerPoint);

  return `
    <div style="font-family: Microsoft YaHei; max-width: 300px;">
      <h3 style="margin: 0 0 10px 0; color: #2c3e50;">${city.name}</h3>
      
      <div style="margin-bottom: 8px;">
        <strong>基本信息:</strong>
      </div>
      
      <div style="margin-left: 15px; line-height: 1.6;">
        ${city.code ? `<div>• 代码：${city.code}</div>` : ''}
        ${city.province ? `<div>• 省份：${city.province}</div>` : ''}
        ${city.pinyin ? `<div>• 拼音：${city.pinyin}</div>` : ''}
        ${city.level ? `<div>• 级别：${getCityLevelText(city.level)}</div>` : ''}
      </div>
      
      <div style="margin: 10px 0 8px 0;">
        <strong>地理位置:</strong>
      </div>
      
      <div style="margin-left: 15px; line-height: 1.6;">
        ${coordinates ? `
          <div>• 经度：${coordinates.longitude.toFixed(6)}</div>
          <div>• 纬度：${coordinates.latitude.toFixed(6)}</div>
        ` : `<div>• 坐标：${city.centerPoint}</div>`}
      </div>
      
      <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #eee;">
        <a href="https://baike.baidu.com/item/${encodeURIComponent(city.name)}" 
           target="_blank" 
           style="color: #3498db; text-decoration: none;">
          📖 查看百度百科
        </a>
        <span style="margin: 0 10px;">|</span>
        <a href="https://www.amap.com/search?query=${encodeURIComponent(city.name)}" 
           target="_blank" 
           style="color: #3498db; text-decoration: none;">
          🗺️ 在高德地图中查看
        </a>
      </div>
    </div>
  `;
}

// 飞行到中国视角
async function flyToChinaView(): Promise<void> {
  if (!viewer) return;

  try {
    await viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(104.0, 35.0, 5000000),
      duration: 2.0
    });
  } catch (error) {
    console.warn('飞行到中国视角失败:', error);
  }
}

// 优化后的加载城市函数
async function loadCities() {
  if (!viewer) {
    console.warn('Cesium viewer 未初始化');
    return;
  }

  cityLoadingStatus.isLoading = true;
  cityLoadingStatus.message = '正在加载城市数据...';

  try {
    console.log('开始加载城市数据...');

    // 加载城市数据
    const response = await axios.get('/cityList.json');
    const cities: CityData[] = response.data;

    if (!Array.isArray(cities) || cities.length === 0) {
      throw new Error('城市数据为空或格式不正确');
    }

    cityLoadingStatus.message = `正在处理 ${cities.length} 个城市...`;

    let loadedCount = 0;
    let errorCount = 0;

    // 清除现有的城市点（除了书签点和新闻点）
    const entitiesToRemove: Cesium.Entity[] = [];
    viewer.entities.values.forEach(entity => {
      if (entity.point && entity.name !== '书签点' &&
        entity.label?.text !== '书签点' &&
        (!entity.properties || !entity.properties.hasProperty('articleId'))) {
        entitiesToRemove.push(entity);
      }
    });

    console.log(`清除现有城市点: ${entitiesToRemove.length} 个`);
    entitiesToRemove.forEach(entity => {
      viewer?.entities.remove(entity);
    });

    // 批量添加城市点
    for (const city of cities) {
      try {
        // 验证城市数据完整性
        if (!city.name || !city.centerPoint) {
          console.warn('城市数据不完整:', city);
          errorCount++;
          continue;
        }

        // 解析经纬度
        const coordinates = parseCoordinates(city.centerPoint);
        if (!coordinates) {
          console.warn(`城市 ${city.name} 坐标格式错误: ${city.centerPoint}`);
          errorCount++;
          continue;
        }

        const { longitude, latitude } = coordinates;

        // 验证经纬度范围
        if (!isValidCoordinate(longitude, latitude)) {
          console.warn(`城市 ${city.name} 坐标超出有效范围: [${longitude}, ${latitude}]`);
          errorCount++;
          continue;
        }

        // 创建城市点实体
        const entity = viewer.entities.add({
          name: city.name,
          id: city.name,
          position: Cesium.Cartesian3.fromDegrees(longitude, latitude),
          point: {
            ...cesiumStore.pointStyles.normal,
            pixelSize: getCityPointSize(city.level),
            outlineWidth: 1,
            outlineColor: Cesium.Color.WHITE,
            scaleByDistance: new Cesium.NearFarScalar(1000, 1.0, 10000000, 0.3),
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          },
          label: {
            text: city.name,
            font: '12pt Microsoft YaHei',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -15),
            show: false,
            scaleByDistance: new Cesium.NearFarScalar(1000, 1.0, 8000000, 0.0),
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          },
          description: generateCityDescription(city),
          show: true
        });

        // 添加城市相关的自定义属性
        entity.addProperty('cityCode', city.code || '');
        entity.addProperty('province', city.province || '');
        entity.addProperty('pinyin', city.pinyin || '');
        entity.addProperty('level', city.level || 0);
        entity.addProperty('longitude', longitude);
        entity.addProperty('latitude', latitude);

        loadedCount++;

        // 每加载100个城市更新一次进度
        if (loadedCount % 100 === 0) {
          cityLoadingStatus.message = `已加载 ${loadedCount}/${cities.length} 个城市...`;
          // 让界面有机会更新
          await new Promise(resolve => setTimeout(resolve, 1));
        }

      } catch (error) {
        console.error(`添加城市点失败 - ${city.name}:`, error);
        errorCount++;
      }
    }

    console.log(`城市点加载完成: 成功 ${loadedCount} 个, 失败 ${errorCount} 个`);

    // 通知面板城市数据已加载
    emitter.emit('cities-loaded', loadedCount);

    // 飞行到中国中心位置以查看所有城市点
    cityLoadingStatus.message = '调整视角中...';
    await flyToChinaView();



  } catch (error) {
    console.error('加载城市数据失败:', error);
    cityLoadingStatus.message = '加载失败: ' + (error as Error).message;
    setTimeout(() => {
      cityLoadingStatus.isLoading = false;
    }, 3000);
    // 发送错误事件
    emitter.emit('cities-load-error', error);
    return;
  } finally {
    setTimeout(() => {
      cityLoadingStatus.isLoading = false;
    }, 1000);
  }
}

// 高德图层添加函数
function addGaodeLayer() {
  if (!viewer) return;

  const existingLayer = viewer.imageryLayers._layers.find(layer =>
    layer.name === "高德矢量"
  );

  if (existingLayer) {
    console.log("高德矢量图层已存在");
    return;
  }

  try {
    const gdProvider = new Cesium.UrlTemplateImageryProvider({
      url: "https://webrd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
      maximumLevel: 18
    });

    const gdLayer = viewer.imageryLayers.addImageryProvider(gdProvider);
    gdLayer.name = "高德矢量";
    console.log("已添加图层：", gdLayer.name);
  } catch (error) {
    console.error("添加高德图层失败:", error);
  }
}

// 建筑物加载函数
async function addBuildings() {
  try {
    const tileset = viewer?.scene.primitives.add(
      await Cesium.Cesium3DTileset.fromIonAssetId(75343),
    );
    if (tileset) {
      viewer?.zoomTo(tileset);
    }
  } catch (error) {
    console.error('加载建筑物失败:', error);
  }
}

// 显示图层信息
function showLayers() {
  if (!viewer) return;
  const layers = viewer.imageryLayers;
  console.log(layers);

  let layersString = "";
  let layersList: (string | undefined)[] = [];
  for (let i = 0; i < layers.length; i++) {
    layersString += layers.get(i).name + "\n";
    layersList.push(layers.get(i).name);
  }
  emit('update', layersString);
  emitter.emit('update', layersList);
}

// 移除所有图层
function removeAll() {
  if (!viewer) return;

  const layers = viewer.imageryLayers;
  for (let i = layers.length - 1; i >= 0; i--) {
    const layer = layers.get(i);
    const provider = layer.imageryProvider;

    if (provider && typeof provider.destroy === 'function') {
      try {
        provider.destroy();
      } catch (error) {
        console.warn("销毁图层提供者时出错:", error);
      }
    }

    layers.remove(layer, true);
  }

  console.log("已清除所有图层");
}

// 高亮城市函数
async function highlightCity(cityName: string): Promise<boolean> {
  if (!cityName || typeof cityName !== 'string' || !viewer) {
    return false;
  }

  try {
    // 重置所有城市点样式
    viewer.entities.values.forEach((entity) => {
      if (entity.point && entity.name !== '书签点' &&
        (!entity.properties || !entity.properties.hasProperty('articleId'))) {
        entity.point = cesiumStore.pointStyles.normal;
        if (entity.label) {
          entity.label.show = false;
        }
      }
    });

    // 查找并高亮指定城市
    const entity = viewer.entities.getById(cityName);
    if (entity && entity.point) {
      entity.point = cesiumStore.pointStyles.highlight;
      if (entity.label) {
        entity.label.show = true;
      }

      // 飞行到该城市
      if (entity.position) {
        await viewer.camera.flyTo({
          destination: entity.position.getValue(viewer.clock.currentTime),
          duration: 1.5
        });
      }

      console.log(`已高亮城市: ${cityName}`);
      return true;
    } else {
      console.warn(`未找到城市: ${cityName}`);
      return false;
    }
  } catch (error) {
    console.error(`高亮城市失败 - ${cityName}:`, error);
    return false;
  }
}

// 添加书签点
function addBookmarkPoint(position: unknown) {
  if (position instanceof Cesium.Cartesian3) {
    const entity = new Cesium.Entity({
      name: '书签点',
      position: position,
      point: cesiumStore.pointStyles.bookmark,
      label: {
        text: '书签点',
        horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(15, -15),
      },
    });
    cesiumStore.bookmarkEntities.add(entity);

    cesiumStore.bookmarkEntities.values.map((entity: Cesium.Entity) => {
      viewer?.entities.remove(entity);
    });
    cesiumStore.bookmarkEntities.values.forEach((entity: Cesium.Entity) => {
      viewer?.entities.add(entity);
    });
  }
}

// 显示/隐藏城市标签
function toggleCityLabels(show: boolean): void {
  if (!viewer) return;

  viewer.entities.values.forEach(entity => {
    if (entity.label && entity.name !== '书签点' &&
      (!entity.properties || !entity.properties.hasProperty('articleId'))) {
      entity.label.show = new Cesium.ConstantProperty(show);
    }
  });

  console.log(`城市标签${show ? '显示' : '隐藏'}`);
}

// 根据省份筛选城市
function filterCitiesByProvince(provinceName: string | null): void {
  if (!viewer) return;

  viewer.entities.values.forEach(entity => {
    if (entity.point && entity.name !== '书签点' &&
      (!entity.properties || !entity.properties.hasProperty('articleId'))) {
      const entityProvince = entity.properties?.province?.getValue();

      if (provinceName === null) {
        entity.show = true;
      } else {
        entity.show = entityProvince === provinceName;
      }
    }
  });

  console.log(`筛选显示${provinceName || '所有'}省份的城市`);
}
watch(
  () => [filters.category, filters.startTime, filters.endTime],
  (newVals, oldVals) => {
    const [newCategory, newStart, newEnd] = newVals as [string, string, string];
    renderNewsArticles(newCategory, newStart, newEnd);
  },
  { immediate: true }
);
// 组件挂载
onMounted(async () => {
  Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwZjEyZjczNS0wODgxLTRmYzMtOWU3MC00ZDIwZGUwMWM5NDMiLCJpZCI6MjgzMTE2LCJpYXQiOjE3NDIxODM2MDB9.6r_855sbwTi1KruUVqqC88aEcboIRcQNMg2ouQ9fPs8';

  if (!mapRef.value) return;

  try {
    await cesiumStore.initViewer(mapRef.value);
    viewer = cesiumStore.viewer;

    // 设置全局viewer引用（供新闻渲染函数使用）
    (window as any).cesiumViewer = viewer;

    if (!viewer) {
      console.error("Cesium viewer 初始化失败");
      return;
    }

    console.log("Cesium viewer 初始化成功");

    // 发送viewer就绪事件，通知LayerPanel可以开始初始化图层
    emitter.emit('viewer-ready');

    // 注册事件监听器
    emitter.on('add-buildings', addBuildings);
    emitter.on('add-layer', addGaodeLayer);
    emitter.on('show-layers', showLayers);
    emitter.on('remove-all-layers', removeAll);
    emitter.on('load-cities', loadCities);
    emitter.on('highlight-city', (event: unknown) => {
      if (typeof event === 'string') highlightCity(event);
    });
    emitter.on('add-bookmark-point', addBookmarkPoint);
    emitter.on('toggle-city-labels', (show: unknown) => {
      if (typeof show === 'boolean') toggleCityLabels(show);
    });
    emitter.on('filter-cities-by-province', (event: unknown) => {
      if (typeof event === 'string' || event === null) filterCitiesByProvince(event);
    });
    // 新增新闻相关事件监听器
    // 定义 load-news 事件处理函数，便于 off 时引用
    const handleLoadNews = (event: unknown) => {
      // 兼容传参方式：数组或对象
      if (Array.isArray(event)) {
        renderNewsArticles(event[0], event[1], event[2]);
      } else if (typeof event === 'object' && event !== null) {
        // 如果是对象，可以按属性名取
        const { category, startTime, endTime } = event as { category?: string, startTime?: string, endTime?: string };
        renderNewsArticles(category, startTime, endTime);
      } else {
        renderNewsArticles();
      }
    };
    emitter.on('load-news', handleLoadNews);
    emitter.on('clear-news', clearNewsPoints);
    emitter.on('toggle-news-labels', (event: unknown) => {
      if (typeof event === 'boolean') toggleNewsLabels(event);
    });
    emitter.on('filter-news-by-category', (event: unknown) => {
      if (typeof event === 'string' || event === null) filterNewsByCategory(event);
    });
  } catch (error) {
    console.error("初始化Cesium时发生错误:", error);
  }
});

// 组件卸载
onUnmounted(() => {
  // 清理事件监听器
  emitter.off('add-buildings', addBuildings);
  emitter.off('add-layer', addGaodeLayer);
  emitter.off('show-layers', showLayers);
  emitter.off('remove-all-layers', removeAll);
  emitter.off('load-cities', loadCities);
  emitter.off('highlight-city', (event: unknown) => {
    if (typeof event === 'string') highlightCity(event);
  });
  emitter.off('add-bookmark-point', addBookmarkPoint);
  emitter.off('toggle-city-labels', (show: unknown) => {
    if (typeof show === 'boolean') toggleCityLabels(show);
  });
  emitter.off('filter-cities-by-province', (event: unknown) => {
    if (typeof event === 'string' || event === null) filterCitiesByProvince(event);
  });
  // 清理新闻相关事件监听器
  emitter.off('load-news', renderNewsArticles);
  emitter.off('clear-news', clearNewsPoints);
  emitter.off('toggle-news-labels', toggleNewsLabels);
  emitter.off('filter-news-by-category', filterNewsByCategory);

  // 清理全局viewer引用
  (window as any).cesiumViewer = null;

  // 清理viewer
  if (viewer && !viewer.isDestroyed()) {
    try {
      viewer.destroy();
    } catch (error) {
      console.warn("销毁viewer时出错:", error);
    }
  }
});
</script>

<style lang="scss" scoped>
.cesium-container {
  position: relative;
  width: 100%;
  height: 100%;

  .cesium-viewer {
    width: 100%;
    height: 100%;
    margin: 0;
  }
}

.filter-form {
  position: absolute;
  top: 200;
  left: 0;
  right: 0;
  bottom: 0;
  width: 600px;
  height: 80px;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100000;

  label {
    display: flex;
    align-items: center;
    margin-right: 16px;

    input,
    select {
      margin-left: 8px;
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid #ccc;
      font-size: 14px;
    }

    input[type="date"] {
      width: 150px;
    }

    select {
      width: 120px;
    }
  }
}

// 加载状态遮罩
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;

  .loading-content {
    background: rgba(255, 255, 255, 0.95);
    padding: 30px;
    border-radius: 10px;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 15px;
    }

    .loading-text {
      font-size: 16px;
      color: #333;
      font-weight: 500;
    }
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

// 隐藏Cesium的logo
:deep(.cesium-widget-credits) {
  display: none;
}
</style>