<template>
  <aside class="absolute left-0 top-0 h-full flex flex-row z-10">
    <div class="w-10 bg-yellow-200 dark:bg-yellow-950! flex flex-col justify-between items-center z-20">
      <div>
        <SideButton :click="togglePanel">
          <Filter />
        </SideButton>
      </div>
      <div>
        <SideButton :click="togglePanel">
          <Setting />
        </SideButton>
      </div>
    </div>

    <!-- Content area -->
    <div class="relative">
      <!-- Sliding panel -->
      <div ref="panel"
        class="absolute top-0 left-0 h-full w-64 bg-base-100 shadow transition-transform transform -translate-x-full bg-yellow-100 dark:bg-yellow-900">
        <div class="p-4">
          <h2 class="text-xl font-bold mb-2">工具面板</h2>
          <p>这里可以放内容、表单、设置项等。</p>
        </div>
      </div>
    </div>


  </aside>
</template>

<script setup lang="ts">
import { Filter, Setting } from '@element-plus/icons-vue';
import SideButton from './SideButton.vue';
import { ref } from 'vue';

const panel = ref<HTMLElement>();


function togglePanel() {
  if (panel.value) {
    panel.value.classList.toggle('-translate-x-full');
    panel.value.classList.toggle('translate-x-0');
  }
}


</script>
