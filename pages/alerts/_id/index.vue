<template>
  <alerts-registry :opts="{ id: route.params.id }"/>
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
