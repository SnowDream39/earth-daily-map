<template>
  <aside class="h-full flex flex-row z-10">
    <div class="w-10 bg-paper flex flex-col justify-between items-center z-20">
      <div>
        <SideButton :click="togglePanel">
          <div class="i-material-symbols-output text-2xl" />
        </SideButton>
      </div>
      <div>
        <SideButton :click="togglePanel">
          <div class="i-material-symbols-settings text-2xl" />
        </SideButton>
      </div>
    </div>

    <!-- Content area -->
    <div class="relative">
      <!-- Sliding panel -->
      <div ref="panel"
        class="absolute top-0 left-0 h-full w-64 bg-base-100 shadow transition-transform transform -translate-x-full bg-paper">
        <div class="p-4">
          <ExportMap :centerLat="0" :centerLng="0" :zoom="1" :width="800" :height="600" :points="[]" />
        </div>
      </div>
    </div>


  </aside>
</template>

<script setup lang="ts">

import ExportMap from './exportMap.vue';
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
