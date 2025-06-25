<template>
  <div class="news-popup absolute top-0 left-0 bg-paper! max-w-md p-4 rounded-lg shadow-lg border backdrop-blur"
    :class="{ 'night': isNight }">
    <h3 class="text-lg font-bold text-red-700 dark:text-red-400 mb-3 leading-snug">
      {{ article.title }}
    </h3>

    <div class="text-sm text-gray-800 dark:text-gray-200 leading-relaxed mb-3">
      {{ article.description }}
    </div>

    <div
      class="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400 py-2 border-t border-b border-gray-200 dark:border-gray-600 mb-3">
      <span v-if="article.source"><strong>来源:</strong> {{ article.source.name }}</span>
      <span v-if="category"><strong>分类:</strong> {{ category }}</span>
      <span v-if="article.publishedAt"><strong>时间:</strong> {{ formatDate(article.publishedAt) }}</span>
    </div>

    <div>
      <a @click="router.push('/article')" class="text-blue-600 dark:text-blue-400 hover:underline">
        📰 阅读完整新闻
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import router from '@/router';
import { computed } from 'vue';

interface Article {
  id: string;
  title: string;
  url: string;
  category: string;
  source: { name: string };
  publishedAt: string;
  description: string;
  author?: string;
  urlToImage?: string;
  content?: string;
  location?: any[];
}

defineProps<{
  article: Article;
  category?: string;
  isNight?: boolean; // 用于切换夜间模式
}>();

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleString('zh-CN');
};
</script>

<style scoped>
.news-popup.night {
  border-color: #00f0ff;
  box-shadow: 0 0 12px #00f0ff;
  background-color: rgba(0, 0, 0, 0.85);
}
</style>
