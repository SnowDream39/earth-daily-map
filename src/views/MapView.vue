<template>
  <Header />
  <div class="relative w-full flex-1 bg-black flex flex-row">
    <Sidebar />
    <CesiumFrame v-if="!isArticle" class="w-full h-full" />
    <ArticleFrame v-if="isArticle" :back="togglePage" class="w-full h-full" />

  </div>
  <Live2dWidget :model-url="modelUrl" class="absolute right-0 bottom-0" />
  <NewsChart v-if="false" class="absolute left-30 bottom-0" />
</template>

<script lang="ts" setup>
import Sidebar from '@/components/Sidebar.vue'
import CesiumFrame from '@/components/CesiumFrame.vue'
import NewsChart from '@/components/NewsChart.vue'
import Header from '@/components/Header.vue'
import { ref } from 'vue'

const HiyoriUrl = '/hiyori_free_zh/runtime/hiyori_free_t08.model3.json'
const modelUrl = '/mao_pro_zh/runtime/mao_pro.model3.json'

const isArticle = ref(false);

const togglePage = () => {
  isArticle.value = !isArticle.value;
};
</script>

<style lang="scss" scoped></style>