<template>
  <div class="flex flex-col gap-4 bg-zinc-200  dark:bg-zinc-800 p-4">
    <div>
      <div class="float-left" @click="props.back()">&lt;返回</div>
    </div>
    <CommentFrame />
  </div>
</template>


<script setup lang="ts">
import CommentFrame from './CommentFrame.vue';

const props = defineProps<{
  back: any
}>();

</script>