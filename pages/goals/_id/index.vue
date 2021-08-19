<template>
  <goal-registry :opts="{ id: $route.params.id }"/>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api';

export default defineComponent({
  middleware: ['isBotStarted'],
});
</script>
