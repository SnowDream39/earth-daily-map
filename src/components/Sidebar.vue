<template>
  <aside class="h-full flex flex-row z-10">
    <!-- Sidebar with buttons -->
    <div class="w-10 bg-paper flex flex-col justify-between items-center z-20">
      <div>
        <SideButton :click="() => openPanel('filter')">
          <div class="i-material-symbols-filter-alt-outline text-2xl" />
        </SideButton>
        <SideButton :click="() => openPanel('layers')">
          <div class="i-material-symbols-layers-outline text-2xl" />
        </SideButton>
        <SideButton :click="() => openPanel('export')">
          <div class="i-material-symbols-output text-2xl" />
        </SideButton>
      </div>
      <div>
        <SideButton :click="() => router.push('/user')">
          <div class="i-material-symbols-account-circle text-2xl" />
        </SideButton>
        <SideButton :click="() => openPanel('settings')">
          <div class="i-material-symbols-settings text-2xl" />
        </SideButton>
      </div>
    </div>

    <!-- Panel Area -->
    <div class="relative">
      <div v-if="currentPanel"
        class="absolute top-0 bg-zinc-100 dark:bg-zinc-700! left-0 h-full bg-base-100 shadow transition-transform transform z-10"
        :class="{
          'translate-x-0': panelVisible,
          '-translate-x-full': !panelVisible,
        }">
        <div class="p-4">
          <component :is="currentPanelComponent" />
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import SideButton from './SideButton.vue'

// 当前面板类型
const currentPanel = ref<string | null>(null)
const panelVisible = ref(false)

function openPanel(panelName: string) {
  if (currentPanel.value === panelName) {
    panelVisible.value = !panelVisible.value
  } else {
    currentPanel.value = panelName
    panelVisible.value = true
  }
}

import ExportPanel from './panels/Export.vue'
import FilterPanel from './panels/Filter.vue'
import LayersPanel from './panels/Layers.vue'
import SettingsPanel from './panels/Settings.vue'
import router from '@/router'

const currentPanelComponent = computed(() => {
  if (currentPanel.value === 'export') return ExportPanel
  if (currentPanel.value === 'filter') return FilterPanel
  if (currentPanel.value === 'layers') return LayersPanel
  if (currentPanel.value === 'settings') return SettingsPanel
  return null
})
</script>
