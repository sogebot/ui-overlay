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
import { cloneDeep } from 'lodash';

import isBotStarted from '~/middleware/isBotStarted';
// eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-imports
import textRegistry from '~/pages/text/_id/index.vue';
import GET from '~/queries/overlays/get.gql';

const route = useRoute();
const { $graphql, $store } = useNuxtApp();

const isLoaded = ref(false);

const cache = ref({} as Record<string, any>);
const cacheChildren = ref({} as Record<string, any>);

const type = ref(null as null | OverlayMapperInterface);
const children = ref([] as any);

const process = () => {
  if (!cache.value || !cacheChildren.value) {
    console.log('Not all data are loaded');
    setTimeout(() => process(), 1000);
    return;
  }
  console.log('Data loaded.');
  isLoaded.value = true;
};

onMounted(() => {
  isBotStarted({ store: $store });
  $graphql.default.request(GET, { id: route.params.id })
    .then((data: any) => (cache.value = data.overlays));
  $graphql.default.request(GET, { groupId: route.params.id })
    .then((data2: any) => (cacheChildren.value = data2.overlays));

  process();
});

watch(cache, (value) => {
  if (!value) {
    return;
  }
  for (const key of Object.keys(value)) {
    if (key.startsWith('__')) {
      continue;
    }
    if (value[key as any].length > 0) {
      type.value = cloneDeep(value[key as any][0]);
      break;
    }
  }
}, { immediate: true, deep: true });

watch(cacheChildren, (value) => {
  if (!value) {
    return;
  }
  for (const key of Object.keys(value)) {
    if (key.startsWith('__')) {
      continue;
    }
    if (value[key as any].length > 0) {
      for (const item of value[key as any]) {
        children.value = [
          ...children.value,
          item,
        ];
      }
    }
  }
}, { immediate: true, deep: true });
</script>
