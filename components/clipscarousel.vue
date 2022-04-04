<template>
  <div>
    <pre v-if="isDebug" class="debug">
      <v-btn @click="currentClip--">-</v-btn>
      <v-btn @click="currentClip++">+</v-btn>
      <json-viewer
        :value="{opts, currentClip, offset, clipWidth, moveToNextClipInProgress, isReady, isVideoSupported, clips: clips.map(o => o.mp4)}"
        boxed
        copyable
        :expand-depth="2"
      />
    </pre>
    <v-alert v-if="!isVideoSupported" color="error" width="auto">
      We are sorry, but this browser doesn't support video mp4/h264
    </v-alert>
    <div
      id="carousel"
      :style="{
        width: opts.animation === 'slide' ? '99999999999%' : '100%',
        position: 'absolute',
        opacity: isReady ? '1' : '0',
        transition: opts.animation === 'slide' ? 'all 1s' : 'all 2s',
      }"
    >
      <div
        v-for="(clip, index) of clips"
        v-if="opts.animation === 'slide'"
        :key="clip.id"
        class="clips"
        :style="{
          transition: `all ${getTransitionTime(index)}s`,
          position: 'absolute',
          left: `${getPositionOfClip(index)}px`,
          opacity: getOpacityOfClip(index),
          visibility: getVisibilityOfClip(index),
          filter: 'grayscale(' + (index === currentClip ? '0' : '1') + ')'}
        "
      >
        <v-overlay v-if="isDebugOverlay" :key="clip.id+'-overlay'" absolute>
          {{ index }}
        </v-overlay>
        <video preload="auto" playsinline>
          <source :src="clip.mp4" type="video/mp4">
        </video>
      </div>
      <div
        v-for="(clip, index) of clips"
        v-if="opts.animation === 'fade'"
        :key="clip.id"
        class="clips"
        style="position: absolute; margin-left: auto; margin-right: auto; left: 0; right: 0; text-align: center;"
      >
        <v-overlay v-if="isDebugOverlay && index === currentClip" :key="clip.id+'-overlay'" absolute>
          {{ index }}
        </v-overlay>
        <video
          preload="auto"
          playsinline
          class="wide"
          :style="{
            transition: `all 2s`,
            opacity: index === currentClip ? '1': '0',
          }"
        >
          <source :src="clip.mp4" type="video/mp4">
        </video>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getSocket } from '@sogebot/ui-helpers/socket';
import JsonViewer from 'vue-json-viewer';

import { isVideoSupported } from '~/functions/isVideoSupported';

const props = defineProps({ opts: Object });
const url = new URL(location.href);
const isDebug = !!url.searchParams.get('debug');
const isDebugOverlay = !!url.searchParams.get('overlay');

const clips = ref([] as any[]);
const currentClip = ref(0);

const offset = ref(0);
const clipWidth = ref(0);

const isReady = ref(false);
const moveToNextClipInProgress = ref(false);

const videoEls = computed(() => {
  return document.getElementsByTagName('video');
});

watch(currentClip, (value) => {
  if (value < 0) {
    currentClip.value = clips.value.length - 1;
  } else if (value === clips.value.length) {
    // we are in loop, reset
    currentClip.value = 0;
  } else {
    play();
  }
});

function play () {
  if (videoEls.value.length === 0) {
    setTimeout(() => play(), 1000);
  }

  Array.from(videoEls.value).forEach((video, idx) => {
    if (idx === currentClip.value) {
      video.currentTime = 0;
      video.volume = (props.opts?.volume ?? 0) / 100;
      video.play().catch((reason) => {
        console.error(`Video cannot be started: ${reason}. Trying again in 1s.`);
        setTimeout(() => play(), 1000);
      });
    } else {
      video.volume = 0;
      video.pause();
    }
  });
}

function getVisibilityOfClip (idx: number) {
  if (currentClip.value === clips.value.length - 1 && idx === 0) {
    // we are at the end so return visible 0 idx
    return 'visible';
  }

  if (currentClip.value === 0 && (idx === clips.value.length - 1 || idx === 1)) {
    // we are at start -> we need to show last idx and second
    return 'visible';
  }

  if (idx - currentClip.value < -1 || idx - currentClip.value > 1) {
    return 'hidden';
  } else {
    return 'visible';
  }
}

function getOpacityOfClip (idx: number) {
  if (idx === currentClip.value) {
    return 1;
  } else {
    return 0.5;
  }
}

function getPositionOfClip (idx: number) {
  const originalOffset = offset.value - clipWidth.value * (currentClip.value - idx);

  if (currentClip.value === 0 && idx === clips.value.length - 1) {
    // we need to move last clip to left if on 0
    return offset.value - clipWidth.value * 1;
  }
  if (currentClip.value === 0 && idx === clips.value.length - 2) {
    // we need to move last - 1 clip to left if on 0 to not break animation
    return offset.value - clipWidth.value * 2;
  }
  if (currentClip.value === 1 && idx === clips.value.length - 1) {
    // we need to move last clip to left if on 1 as well (to not break animation)
    return offset.value - clipWidth.value * 2;
  }

  if (originalOffset < -(clipWidth.value * 2)) {
    // we need to move it to right
    return offset.value - clipWidth.value * (currentClip.value - (idx + clips.value.length));
  }
  return originalOffset;
}

function getTransitionTime (idx: number) {
  if (getPositionOfClip(idx) > window.innerWidth) {
    return '0';
  } else {
    return '1';
  }
}

onMounted(() => {
  console.log('====== CLIPS CAROUSEL ======');
  getSocket('/overlays/clipscarousel', true).emit('clips', { customPeriod: props.opts?.customPeriod ?? 31, numOfClips: props.opts?.numOfClips ?? 20 }, (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    data.clips = data.clips
      .map((a: any) => ({ sort: Math.random(), value: a }))
      .sort((a: any, b: any) => a.sort - b.sort)
      .map((a: any) => a.value);

    if (data.clips.length < 4) {
      return console.error('At least 4 clips are needed');
    }

    clips.value = data.clips;

    nextTick(() => {
      // from .clips get width of clip
      clipWidth.value = document.getElementsByClassName('clips')[0].clientWidth;
      offset.value = window.innerWidth / 2 - clipWidth.value / 2;

      currentClip.value++;
      setTimeout(() => {
        isReady.value = true;
      }, 1000);

      setInterval(() => {
        // check if video is ended
        if (videoEls.value[currentClip.value].ended) {
          currentClip.value++;
        }
      }, 100);
    });
  });
});
</script>

<style scoped>
  .clips {
    transition: all 1s;
  }

  video.wide {
    width: 90vw;
  }

  video {
    width: 40vw;
    padding: 5vw;
    display: inline-block;
  }

  .debug {
    position: absolute;
  }
</style>
