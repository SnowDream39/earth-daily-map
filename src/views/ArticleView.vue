<template>
  <div class="min-h-screen bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-6">
    <!-- 返回按钮 -->
    <div class="mb-4">
      <button @click="router.push('/')" class="text-sm text-blue-600 dark:text-blue-400 hover:underline">
        ← 返回首页
      </button>
    </div>

    <!-- 新闻卡片 -->
    <div class="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-6 space-y-4">
      <h1 class="text-2xl font-bold text-zinc-900 dark:text-white">{{ article.title }}</h1>
      <p class="text-zinc-700 dark:text-zinc-300">{{ article.description }}</p>

      <!-- 元信息 -->
      <div class="text-sm text-zinc-500 dark:text-zinc-400 space-x-4">
        <span v-if="article.source">来源：{{ article.source.name }}</span>
        <span v-if="article.category">分类：{{ article.category }}</span>
        <span v-if="article.publishedAt">
          时间：{{ new Date(article.publishedAt).toLocaleString('zh-CN') }}
        </span>
      </div>

      <!-- 阅读原文按钮 -->
      <a class="inline-block mt-2 text-blue-600 dark:text-blue-400 hover:underline text-sm" :href="article.url"
        target="_blank">
        📰 阅读完整新闻
      </a>
    </div>

    <!-- 评论组件 -->
    <div class="mt-6 flex justify-center">
      <CommentFrame />
    </div>
  </div>
</template>

<script setup lang="ts">
import CommentFrame from '../components/user/CommentFrame.vue';
import { useArticleStore } from '@/stores/article';
import router from '@/router';
import { computed } from 'vue';

const articleStore = useArticleStore();
const article = computed(() => articleStore.current);
</script>
