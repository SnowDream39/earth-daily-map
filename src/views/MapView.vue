<template>
  <Header />
  <div class="relative w-full flex-1 bg-black">
    <CesiumFrame v-if="false" class="w-full h-full" />
    <Sidebar />
  </div>
  <Live2dWidget :model-url="modelUrl" class="absolute right-0 bottom-0" />
</template>

<script lang="ts" setup>
import Sidebar from '@/components/Sidebar.vue'
import CesiumFrame from '@/components/CesiumFrame.vue'
import Header from '@/components/Header.vue'

const HiyoriUrl = '/hiyori_free_zh/runtime/hiyori_free_t08.model3.json'
const modelUrl = '/mao_pro_zh/runtime/mao_pro.model3.json'
</script>

<style lang="scss" scoped></style>