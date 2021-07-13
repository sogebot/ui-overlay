<template>
  <v-app>
    <v-main>
      <component
        :is="type.value"
        v-if="$store.state.isUILoaded && type"
        :opts="type.opts"
      />
    </v-main>
  </v-app>
</template>

<script lang="ts">
import {
  defineComponent, onMounted, ref, useContext, useRoute,
} from '@nuxtjs/composition-api';

import type { OverlayMapperInterface, OverlayMapperOBSWebsocket } from '~/.bot/src/bot/database/entity/overlay';

export default defineComponent({
  middleware: ['isBotStarted'],
  setup () {
    const { $axios } = useContext();
    const route = useRoute();
    const type = ref(null as null | OverlayMapperInterface | OverlayMapperOBSWebsocket);
    onMounted(async () => {
      try {
        if (!route.value.params.id) {
          throw new Error('Unknown overlay link!');
        }

        type.value = await new Promise((resolve, reject) => {
          $axios.get(location.origin + '/api/v1/overlay/' + route.value.params.id)
            .then(response => resolve(response.data))
            .catch(() => reject(new Error('Unknown overlay link ' + route.value.params.id + '!')));
        });
      } catch (e) {
        console.error(e);
      }
    });

    return { type };
  },
});
</script>
