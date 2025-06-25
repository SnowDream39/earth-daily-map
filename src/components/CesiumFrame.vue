<template>
  <div class="cesium-container">
    <!-- 地图容器 -->
    <div ref="mapRef" class="cesium-viewer"></div>


    <!-- 城市加载状态提示 -->
    <div v-if="cityLoadingStatus.isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">{{ cityLoadingStatus.message }}</div>
      </div>
    </div>
    <!--新闻详情-->
    <Popup v-if="showPopup" :article="article" :category="article.category" :isNight="true" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, reactive, watch } from "vue";
import { useCesiumStore } from "@/stores/cesium";
import * as Cesium from "cesium";
import emitter from "@/utils/emitter";
import { loadNewsData } from "@/utils/article";
import type { LocationItem, Source, Article, CityData } from "@/types/news";
import Popup from "@/components/Popup.vue";
import { useArticleStore } from '@/stores/article'

const filters = reactive({
  startTime: '',
  endTime: '',
  category: '',
});

const categories = [
  'technology', 'sports', 'entertainment',
  'general', 'health', 'science'
];

const articleStore = useArticleStore()
const article = ref<any>();

//弹窗事件：
const showPopup = ref(false)
const popupHtml = ref('')

function closePopup() {
  showPopup.value = false
}
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
          // 添加新闻相关的自定义属性
          properties: new Cesium.PropertyBag({
            articleId: new Cesium.ConstantProperty(article.id),
            newsTitle: new Cesium.ConstantProperty(article.title),
            newsUrl: new Cesium.ConstantProperty(article.url),
            newsSource: new Cesium.ConstantProperty(article.source || ''),
            publishTime: new Cesium.ConstantProperty(article.publishedAt || ''),
            description: new Cesium.ConstantProperty(article.description || ''),
          }),
          show: true
        });
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
    emitter.on('add-layer', addGaodeLayer);
    emitter.on('show-layers', showLayers);
    emitter.on('remove-all-layers', removeAll);

    //点击与description生成：
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
    handler.setInputAction(
      (click: { position: Cesium.Cartesian2; }) => {
        console.log('点击事件触发', click.position);
        if (!viewer) {
          showPopup.value = false;
          return;
        }
        const picked = viewer.scene.pick(click.position);
        if (Cesium.defined(picked) && picked.id && picked.id.properties) {
          const props = picked.id.properties;
          article.value = {
            id: props.articleId?.getValue(new Date()),
            title: props.newsTitle?.getValue(new Date()),
            url: props.newsUrl?.getValue(new Date()),
            category: props.newsCategory?.getValue(new Date()),
            source: props.newsSource?.getValue(new Date()),
            publishedAt: props.publishTime?.getValue(new Date()),
            description: props.description?.getValue(new Date()),
            author: '', // 补充缺失字段
            urlToImage: '', // 补充缺失字段
            content: '', // 补充缺失字段
            location: [], // 补充缺失字段
          };
          console.log('点了');
          articleStore.current = article.value;
          console.log(articleStore.current)
          showPopup.value = true;
        } else {
          showPopup.value = false;
        }
      },
      Cesium.ScreenSpaceEventType.LEFT_CLICK
    );


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
  emitter.off('add-layer', addGaodeLayer);
  emitter.off('show-layers', showLayers);
  emitter.off('remove-all-layers', removeAll);
  // 清理新闻相关事件监听器
  emitter.off('clear-news', clearNewsPoints);

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

.popup {
  position: fixed;
  top: 10vh;
  left: 50%;
  transform: translateX(-50%);
  max-width: 420px;
  background: white;
  box-shadow: 0 0 12px rgb(0 0 0 / 0.3);
  border-radius: 8px;
  padding: 20px;
  z-index: 99999;
  max-height: 70vh;
  overflow-y: auto;
  cursor: default;
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