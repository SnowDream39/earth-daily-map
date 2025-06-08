<template>
  <div class="text-lg rounded-2 hover:bg-gray/50" :class="dynamicClass" @click="click"></div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';


const props = defineProps<{
  classBefore: string,
  classAfter: string,
  action: any
}>()

const visited = ref(false)
const dynamicClass = computed(() => {
  return visited.value ? props.classAfter : props.classBefore
})

const click = () => {
  visited.value = true;
  props.action()
}

</script>