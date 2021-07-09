<template>
  <component
    :is="type.value"
    v-if="$store.state.isUILoaded && type"
    :opts="type.opts"
  />
</template>

<script lang="ts">
import {
  defineAsyncComponent,
  defineComponent, onMounted, ref, useContext, useRoute,
} from '@nuxtjs/composition-api';

import type { OverlayMapperInterface, OverlayMapperOBSWebsocket } from '~/.bot/src/bot/database/entity/overlay';

export default defineComponent({
  middleware: ['isBotStarted'],
  components: {
    /* alerts:        () => import('./alerts.vue'),
    carousel:      () => import('./carousel.vue'),
    clips:         () => import('./clips.vue'),
    clipscarousel: () => import('./clipscarousel.vue'),
    credits:       () => import('./credits.vue'),
    emotes:        () => import('./emotes.vue'),
    emotescombo:   () => import('./emotescombo.vue'),
    eventlist:     () => import('./eventlist.vue'),
    polls:         () => import('./polls.vue'),
    randomizer:    () => import('./randomizer.vue'), */
    bets:         defineAsyncComponent(() => import('~/components/bets.vue')),
    obswebsocket: defineAsyncComponent(() => import('~/components/obswebsocket.vue')),
    stats:        defineAsyncComponent(() => import('~/components/stats.vue')),
    tts:          defineAsyncComponent(() => import('~/components/tts.vue')),
  },
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
