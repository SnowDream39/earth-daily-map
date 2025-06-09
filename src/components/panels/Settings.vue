<template>
  <div class="w-64 space-y-4">
    <h2 class="text-2xl font-bold">界面设置</h2>

    <!-- 主题颜色选择 -->
    <div>
      <label class="py-2">主题颜色</label>
      <select v-model="theme"
        class="w-full px-3 py-2 border rounded bg-white dark:bg-gray-900! dark:text-white! border-gray-300 dark:border-cyan-400! focus:outline-none focus:ring-2 focus:ring-blue-400! dark:focus:ring-cyan-400!">
        <option value="light">浅色模式</option>
        <option value="dark">深色模式</option>
        <option value="auto">跟随系统</option>
      </select>
    </div>

    <!-- 字体大小调整 -->
    <div>
      <label class="block text-sm font-medium mb-1">字体大小</label>
      <input type="range" min="12" max="24" v-model="fontSize" />
      <div class="text-sm text-gray-500 mt-1">当前字体大小：{{ fontSize }}px</div>
    </div>

    <!-- 是否显示动画 -->
    <div>
      <label class="flex items-center space-x-2">
        <input type="checkbox" v-model="animationsEnabled" />
        <span>启用界面动画</span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const theme = ref<'light' | 'dark' | 'auto'>('auto')
const fontSize = ref(16)
const animationsEnabled = ref(true)
</script>
