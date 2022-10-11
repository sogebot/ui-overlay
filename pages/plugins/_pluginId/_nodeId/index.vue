<template>
  <plugin-custom-overlay :opts="{ pluginId: route.params.pluginId, nodeId: route.params.nodeId }"/>
</template>

<script lang="ts">
export default ({
  middleware: ['isBotStarted'],
  setup () {
    const route = useRoute();
    return { route };
  },
});
</script>
