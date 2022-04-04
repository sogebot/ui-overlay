<template>
  <div>
    <v-alert v-if="!isVideoSupported" color="error" width="auto">
      We are sorry, but this browser doesn't support video mp4/h264
    </v-alert>
    <div v-if="isPlaying" v-show="options.showLabel" id="label" class="label">
      <v-icon color="red" x-large>
        {{ mdiCircleMedium }}
      </v-icon>
    </div>
    <transition name="fade">
      <video
        v-show="isPlaying"
        v-if="playingClip"
        id="video"
        playsinline
        autoplay="true"
        :class="['filter-' + options.filter]"
      >
        <source :src="playingClip.mp4" type="video/mp4">
      </video>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { mdiCircleMedium } from '@mdi/js';
import { getSocket } from '@sogebot/ui-helpers/socket';
import gsap from 'gsap';
import { defaults } from 'lodash';

import { isVideoSupported } from '~/functions/isVideoSupported';

const props = defineProps({ opts: Object });
const isPlaying = ref(false);
const clips = ref([] as any[]);

const options = ref(
  defaults(props.opts, {
    volume:    0,
    filter:    'none',
    showLabel: true,
  }));

onMounted(() => {
  getSocket('/overlays/clips', true).on('clips', (data: any) => {
    for (let i = 0, len = data.clips.length; i < len; i++) {
      clips.value.push(data.clips[i]);
    }
  });

  setInterval(() => {
    const video = document.getElementById('video') as HTMLMediaElement;
    if (video !== null && video.ended) {
      isPlaying.value = false;
      clips.value.shift();
    }

    if (!isPlaying.value) {
      isPlaying.value = playingClip.value !== null;
    }
  }, 100);
});

watch(isPlaying, (val) => {
  if (val) {
    const video = document.getElementById('video') as HTMLMediaElement;
    video.volume = options.value.volume / 100;
    video.play();

    nextTick(function () {
      if (options.value.showLabel && document.getElementById('label')) {
        gsap.fromTo(document.getElementById('label'), { duration: 1, opacity: 0 }, {
          opacity: 1, yoyo: true, repeat: -1,
        });
      }
    });
  }
});

const playingClip = computed(() => {
  return clips.value.length > 0 ? clips.value[0] : null;
});

</script>

<style>
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 2s;
  }

  .fade-enter,
  .fade-leave-to {
    opacity: 0;
  }
  video { width: 100%; }

  .label {
    z-index: 9999999999;
    color: red;
    position: absolute;
    right: -5px;
    top: -5px;
    font-weight: bold;
    text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
  }

  /* filters */
  .filter-grayscale {
    -webkit-filter: grayscale(1);
    filter: grayscale(1);
  }

  .filter-sepia {
    -webkit-filter: sepia(1);
    filter: sepia(1);
  }

  .filter-tint {
    -webkit-filter: sepia(1) hue-rotate(200deg);
    filter: sepia(1) hue-rotate(200deg);
  }

  .filter-washed {
    -webkit-filter: contrast(1.4) saturate(1.8) sepia(0.6);
    filter: contrast(1.4) saturate(1.8) sepia(0.6);
  }
</style>
