<template>
  <div id="emotes">
    <transition v-for="e of emotes" :key="e.id" :name="e.animation.type" :duration="e.animation.time" :css="false"
      @leave="doAnimation">
      <img v-if="!e.animation.finished" v-show="e.show && !e.animation.running" :id="e.id" :src="e.url"
        style="position: absolute" :style="{ 'left': e.position.left + 'px', 'top': e.position.top + 'px' }">
    </transition>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import {
  nextTick, onMounted, ref,
} from '@vue/composition-api';
import gsap from 'gsap';
import {
  defaults, every, random,
} from 'lodash';

const maxEmoteGuard = new Map<string, number>();

export default defineComponent({
  props: { opts: Object },
  setup (props) {
    const options = ref(
      defaults(props.opts, {
        emotesSize:          3,
        animation:           'fadeup',
        animationTime:       1000,
        maxEmotesPerMessage: 5,
      }));
    const emotes = ref([] as any[]);

    onMounted(() => {
      console.log('====== EMOTES ======');
      getSocket('/core/emotes', true).on('emote', (opts: any) => addEmote(opts));

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

      let animation: any = { opacity: 0 };

      if (emote.animation.type === 'fadeup') {
        animation = {
          top:     emote.position.top - 150,
          opacity: 0,
        };
      } else if (emote.animation.type === 'facebook') {
        animation = {
          top:     emote.position.top - random(window.innerHeight / 4, window.innerHeight / 1.2),
          left:    random(emote.position.left - 100, Math.min(emote.position.left + 100, window.innerWidth - 100)),
          opacity: 0,
        };
      } else if (emote.animation.type === 'fadezoom') {
        animation = {
          scale:   2,
          opacity: 0,
        };
      }

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

    const setLeft = (type: string) => {
      if (type === 'fadeup' || type === 'fadezoom') {
        return random(window.innerWidth - 200) + 100;
      } else if (type === 'facebook') {
        return random(200) + window.innerWidth - 350;
      } else {
        return window.innerWidth / 2;
      }
    };

    const setTop = (type: string) => {
      if (type === 'fadeup' || type === 'fadezoom') {
        return random(window.innerHeight - 200) + 100;
      } else if (type === 'facebook') {
        return window.innerHeight - 20;
      } else {
        return window.innerHeight / 2;
      }
    };

    const addEmote = (opts: any) => {
      const guard = maxEmoteGuard.get(opts.id) ?? 0;
      if (guard === -1 || guard >= options.value.maxEmotesPerMessage) {
        if (guard !== -1) {
          maxEmoteGuard.set(opts.id, -1);
          setTimeout(() => {
            // cleanup id after while
            maxEmoteGuard.delete(opts.id);
          }, 5000);
        }
        return;
      }
      maxEmoteGuard.set(opts.id, guard + 1);

      emotes.value.push({
        id:        Math.random().toString(36).substr(2, 9) + '-' + Math.random().toString(36).substr(2, 9),
        trigger:   Date.now() + random(500),
        show:      false,
        animation: {
          type:     options.value.animation,
          time:     options.value.animationTime,
          running:  false,
          finished: false,
        },
        position: {
          left: setLeft(options.value.animation),
          top:  setTop(options.value.animation),
        },
        url: opts.url[options.value.emotesSize],
      });
    };

    return {
      doAnimation,
      emotes,
    };
  },
});
</script>
