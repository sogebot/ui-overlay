<template>
  <v-app style="padding: 0; margin: 0;">
    <v-main style="padding: 0; margin: 0;">
      <component
        :is="type.value"
        v-if="isLoaded && type && (type.value !== 'group' || (type.value === 'group' && children.length > 0))"
        :opts="type.opts"
        :children="children"
      />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import type { OverlayMapperInterface } from '@entity/overlay';
import { getSocket } from '@sogebot/ui-helpers/socket';

import isBotStarted from '~/middleware/isBotStarted';
// eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-imports
import textRegistry from '~/pages/text/_id/index.vue';

const route = useRoute();
const { $store } = useNuxtApp();

const isLoaded = ref(false);

const type = ref(null as null | OverlayMapperInterface);
const children = ref([] as any);

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

  getSocket('/registries/overlays', true).emit('generic::getAll', (err, result) => {
    if (err) {
      return console.error(err);
    }

    children.value = result.filter(o => o.groupId === route.params.id);
    type.value = (result.find(o => o.id === route.params.id) as any) ?? null;

    loading.value = false;
  });

  process();
});
</script>
