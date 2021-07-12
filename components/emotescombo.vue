<template>
  <div id="emotes">
    <div v-if="isDebug">
      <json-viewer
        :value="{threshold, url, count, inactivity, currentTime, updatedAt, isActive: currentTime - updatedAt < inactivity * 1000 }"
        boxed
        copyable
        :expand-depth="10"
      />
    </div>
    <transition name="fade">
      <img
        v-if="url !== null && count >= threshold && currentTime - updatedAt < inactivity * 1000"
        :src="url"
        width="100%"
      >
    </transition>
  </div>
</template>

<script lang="ts">
import {
  defineComponent, onMounted, ref,
} from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import JsonViewer from 'vue-json-viewer';

export default defineComponent({
  components: { JsonViewer },
  props:      { opts: Object },
  setup (props) {
    const isDebug = !!(new URL(location.href)).searchParams.get('debug');
    const threshold = ref(props.opts?.showEmoteInOverlayThreshold ?? 3);
    const url = ref(null as null | string);
    const count = ref(0);
    const inactivity = ref(props.opts?.hideEmoteInOverlayAfter ?? 30);
    const updatedAt = ref(Date.now());
    const currentTime = ref(Date.now());

    setInterval(() => {
      currentTime.value = Date.now();
    }, 1000);

    onMounted(() => {
      console.log('====== EMOTES COMBO ======');
      getSocket('/core/emotes', true).on('combo', (opts: { count: number; url: string }) => {
        console.groupCollapsed('combo update received');
        console.log({ ...opts });
        console.groupEnd();
        url.value = opts.url;
        count.value = opts.count;
        updatedAt.value = Date.now();
      });
    });
    return {
      threshold, url, count, inactivity, updatedAt, currentTime, isDebug,
    };
  },
});
</script>

<style>
.fade-enter-active, .fade-leave-active {
  transition: opacity .5s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}

#emotes {
  width: 100vw;
  height: 100vh;
}

img {
  max-width: 100vw;
  max-height: 100vh;
}

.debug {
  z-index: 9999;
  background-color: rgba(0, 0, 0, 0.5);
  position: absolute;
  color: white;
  padding: 1rem;
}
</style>
