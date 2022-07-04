<template>
  <iframe
    frameBorder="0"
    :src="props.opts.url"
    width="100%"
    height="100%"
  />
</template>

<script setup lang="ts">
const props = defineProps({ opts: Object });

onMounted(async () => {
  console.log('====== URL ======');
});
</script>
