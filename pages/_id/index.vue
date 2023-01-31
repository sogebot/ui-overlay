<template>
  <v-app style="padding: 0; margin: 0;">
    <v-main style="padding: 0; margin: 0;">
      <group
        v-if="isLoaded"
        :overlay="overlay"
      />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { Overlay } from '@entity/overlay';
import { getSocket } from '@sogebot/ui-helpers/socket';

import isBotStarted from '~/middleware/isBotStarted';
// eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-imports
import textRegistry from '~/pages/text/_id/index.vue';

const route = useRoute();
const { $store } = useNuxtApp();

const isLoaded = ref(false);

const overlay = ref(null as null | Overlay);

const loading = ref(true);

const process = () => {
  if (loading.value) {
    console.log('Not all data are loaded');
    setTimeout(() => process(), 1000);
    return;
  }
  console.log('Data loaded.');
  isLoaded.value = true;
};

onMounted(() => {
  isBotStarted({ store: $store });

  getSocket('/registries/overlays', true).emit('generic::getOne', route.params.id, (err, result) => {
    if (err) {
      return console.error(err);
    }
    overlay.value = result;
    loading.value = false;
  });

  process();
});
</script>
