<template>
  <div class="w-10 h-10 flex justify-center items-center rounded-lg hover:bg-gray/50">
    <button @click="props.click()" class="w-6 h-6">
      <el-icon>
        <slot></slot>
      </el-icon>
    </button>
  </div>
</template>


<script setup lang="ts">
import { Filter } from '@element-plus/icons-vue'

const props = defineProps<{
  click: any
}>()

</script>