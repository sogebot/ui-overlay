<template>
  <v-app style="padding: 0; margin: 0;">
    <v-main style="padding: 0; margin: 0;">
      <component
        :is="type.value"
        v-if="$store.state.isUILoaded && isLoaded && type"
        :opts="type.opts"
        :children="children"
      />
    </v-main>
  </v-app>
</template>

<script lang="ts">
import type { OverlayMapperInterface } from '@entity/overlay';
import {
  defineComponent, onMounted, ref, useContext, useRoute, watch,
} from '@nuxtjs/composition-api';
import { cloneDeep } from 'lodash';

import GET from '~/queries/overlays/get.gql';

export default defineComponent({
  components: { textRegistry: () => import('~/pages/text/_id/index.vue') },
  middleware: ['isBotStarted'],
  setup () {
    const route = useRoute();
    const context = useContext();

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
      (context as any).$graphql.default.request(GET, { id: route.value.params.id })
        .then((data: any) => (cache.value = data.overlays));
      (context as any).$graphql.default.request(GET, { groupId: route.value.params.id })
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

    return {
      type, isLoaded, children,
    };
  },
});
</script>
