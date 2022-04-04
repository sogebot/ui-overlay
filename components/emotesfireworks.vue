<template>
  <div id="emotes">
    <transition
      v-for="e of emotes"
      :key="e.id"
      :name="e.animation.type"
      :duration="e.animation.time"
      :css="false"
      @leave="doAnimation"
    >
      <img
        v-if="!e.animation.finished"
        v-show="e.show && !e.animation.running"
        :id="e.id"
        :src="e.url"
        style="position: absolute;"
        :style="{ 'left': e.position.left + 'px', 'top': e.position.top + 'px' }"
      >
    </transition>
  </div>
</template>

<script setup lang="ts">
import { getSocket } from '@sogebot/ui-helpers/socket';
import gsap from 'gsap';
import {
  defaults, every, random, sample,
} from 'lodash';

const props = defineProps({ opts: Object });
const options = ref(
  defaults(props.opts, {
    emotesSize:              3,
    numOfEmotesPerExplosion: 10,
    animationTime:           1000,
    numOfExplosions:         5,
  }));
const emotes = ref([] as any[]);

onMounted(() => {
  console.log('====== EMOTES FIREWORKS ======');
  getSocket('/services/twitch', true).on('emote.firework', (opts: any) => firework(opts));

  setInterval(() => {
    triggerAnimation();
    cleanEmotes();
  }, 100);
});

const cleanEmotes = () => {
  if (every(emotes.value, o => o.animation.finished)) {
    emotes.value = [];
  }
};

const doAnimation = (el: HTMLElement, done: () => void) => {
  const id = el.id;
  const emote = emotes.value.find(o => o.id === id);

  const animation = {
    top:     random(emote.position.top - 100, emote.position.top + 100),
    left:    random(emote.position.left - 100, emote.position.left + 100),
    opacity: 0,
  };

  gsap.to(el, {
    duration:   emotes.value.find(o => o.id === id).animation.time / 1000,
    ...animation,
    onComplete: () => {
      emotes.value.find(o => o.id === id).animation.finished = true;
      done();
    },
  });
};

const triggerAnimation = () => {
  for (let i = 0, length = emotes.value.length; i < length; i++) {
    if (!emotes.value[i].animation.running && Date.now() - emotes.value[i].trigger > 0) {
      // show and after next tick hide -> trigger animation
      emotes.value[i].show = true;
      nextTick(function () {
        emotes.value[i].animation.running = true;
      });
    }
  }
};

const firework = (opts: any) => {
  for (let i = 0; i < options.value.numOfExplosions; i++) {
    const commonTop = random(200, window.innerHeight - 200);
    const commonLeft = random(200, window.innerWidth - 200);
    const commonTrigger = Date.now() + random(3000);
    const commonUrl = sample(opts.emotes)[options.value.emotesSize];
    for (let j = 0; j < options.value.numOfEmotesPerExplosion; j++) {
      emotes.value.push({
        id:        Math.random().toString(36).substr(2, 9) + '-' + Math.random().toString(36).substr(2, 9),
        trigger:   commonTrigger,
        show:      false,
        animation: {
          type:     'firework',
          time:     options.value.animationTime,
          running:  false,
          finished: false,
        },
        position: {
          left: commonLeft,
          top:  commonTop,
        },
        url: commonUrl,
      });
    }
  }
};
</script>
