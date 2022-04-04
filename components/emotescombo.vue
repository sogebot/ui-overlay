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
      <div v-if="url !== null && count >= threshold && currentTime - updatedAt < inactivity * 1000" style="padding: 5px;">
        <div style="display: inline-block;" class="emotes-combo-text">
          {{ count }}x
        </div>
        <img
          :src="url"
        >
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { getSocket } from '@sogebot/ui-helpers/socket';
import JsonViewer from 'vue-json-viewer';

const props = defineProps({ opts: Object });
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
  getSocket('/systems/emotescombo', true).on('combo', (opts: { count: number; url: string }) => {
    console.groupCollapsed('combo update received');
    console.log({ ...opts });
    console.groupEnd();
    url.value = opts.url;
    count.value = opts.count;
    updatedAt.value = Date.now();
  });
});
</script>

<style>
@import url("https://fonts.googleapis.com/css?family=Dongle");

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter,
.fade-leave-to {
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
  background-color: rgb(0 0 0 / 50%);
  position: absolute;
  color: white;
  padding: 1rem;
}

.emotes-combo-text {
  font-family: Dongle, sans-serif;
  color: #fff;
  font-weight: bold;
  text-shadow: 0 0 10px #000, 1px 1px 1px #000;
  font-size: 2.2rem;
  padding-left: 1rem;
  padding-right: 1rem;
  transform: translateY(-5px);
}
</style>
