<template>
  <v-app style="padding: 0; margin: 0;">
    <v-main style="padding: 0; margin: 0;">
      <component
        :is="type.value"
        v-if="$store.state.isUILoaded && type"
        :opts="type.opts"
      />
    </v-main>
  </v-app>
</template>

<script lang="ts">
import type {
  OverlayMapperInterface, OverlayMapperOBSWebsocket, OverlayMappers,
} from '@entity/overlay';
import {
  defineComponent, ref, useRoute, watch,
} from '@nuxtjs/composition-api';
import { useQuery, useResult } from '@vue/apollo-composable';
import { cloneDeep } from 'lodash';

import GET from '~/queries/overlays/get.gql';

export default defineComponent({
  components: { textRegistry: () => import('~/pages/text/_id/index.vue') },
  middleware: ['isBotStarted'],
  setup () {
    const route = useRoute();

    const { result } = useQuery(GET, { id: route.value.params.id });
    const cache = useResult<{ overlays: any[] }, OverlayMappers[]>(result, []);
    const type = ref(null as null | OverlayMapperInterface | OverlayMapperOBSWebsocket);

    watch(cache, (value) => {
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

    return { type };
  },
});
</script>
