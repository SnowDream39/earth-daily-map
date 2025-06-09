<template>

  <!-- 开始时间 -->
  <label class="flex flex-col text-sm">
    <span class="mb-1 font-medium">开始时间</span>
    <input type="date" v-model="filters.startTime" class="input-style" />
  </label>

  <!-- 结束时间 -->
  <label class="flex flex-col text-sm">
    <span class="mb-1 font-medium">结束时间</span>
    <input type="date" v-model="filters.endTime" class="input-style" />
  </label>

  <!-- 类别选择 -->
  <label class="flex flex-col text-sm">
    <span class="mb-1 font-medium">类别名称</span>
    <select v-model="filters.category" class="input-style">
      <option value="">全部</option>
      <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
    </select>
  </label>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'

// 过滤条件
const filters = reactive({
  startTime: '',
  endTime: '',
  category: '',
})

// 分类选项
const categories = [
  'technology', 'sports', 'entertainment',
  'general', 'health', 'science'
]

// 检测是否为暗色模式（基于 HTML 类）
const isDark = computed(() => {
  return document.documentElement.classList.contains('dark')
})
</script>

<style scoped>
.input-style {
  @apply
}
</style>
