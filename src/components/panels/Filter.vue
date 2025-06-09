<template>
  <!-- 筛选面板 -->
  <div class="filter-form bg-paper" style="margin-bottom: 16px;">
    <label>
      开始时间：
      <input type="date" v-model="filters.startTime" />
    </label>

    <label style="margin-left: 12px;">
      结束时间：
      <input type="date" v-model="filters.endTime" />
    </label>

    <label style="margin-left: 12px;">
      类别名称：
      <select v-model="filters.category">
        <option value="">全部</option>
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </select>
    </label>
  </div>

</template>

<script setup lang="ts">
import { reactive } from 'vue';
const filters = reactive({
  startTime: '',
  endTime: '',
  category: '',
});

const categories = [
  'technology', 'sports', 'entertainment',
  'general', 'health', 'science'
];
</script>
