<template>
  <div>
    <div
      id="train"
      :style="{
        left: `${width}px`,
        transform: `translateX(-${left.value}px)`
      }"
    >
      <v-img src="/_static/hypeTrain.png" height="105" width="210" class="d-inline-block shake" />
      <div
        v-for="(couple, idx) of chunk(subs, 2)"
        :key="idx"
        style="display: inline-block; width: 210px; animation-delay: 0.2s"
        class="shake"
        :style="{
          'animation-delay': `${idx* 0.2}s`
        }"
      >
        <v-img src="/_static/hypeWagon.png" height="105" width="210" class="d-inline-block" />
        <div
          v-for="(sub, subIdx) of couple"
          :key="sub.username"
          :style="{
            left: `${subIdx ? 130 : 10}px`
          }"
          style="display: inline-block; position: absolute; top: 10px"
          class="wiggle"
        >
          <strong class="shadow" style="position: absolute; top: -20px; transform: translateX(-50%); margin-left: 50%;">{{ sub.username }}</strong>
          <v-img width="70" height=" 70" contain :src="sub.thumbnailUrl" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent, onMounted, ref,
} from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import gsap from 'gsap';
import { chunk } from 'lodash';

export default defineComponent({
  props: { opts: Object },
  setup () {
    let animationIsFree = true;

    const width = ref(1920);
    const left = ref({ value: 0 });
    const level = ref(0);

    const events: { level: number, goal: number, total: number}[] = [];

    const subs = ref([] as {username: string; thumbnailUrl: string}[]);

    const moveTrain = (data: { level: number, goal: number, total: number}, path?: number) => {
      if (!path) {
        path = (width.value / data.goal) * data.total;
      }
      return new Promise((resolve) => {
        gsap.to(left.value, {
          duration: 2, value: path, roundProps: 'value', onComplete: resolve, ease: 'linear',
        });
      });
    };

    const process = async (data: typeof events[number]) => {
      animationIsFree = false;
      if (data.level === level.value || data.level === 1) {
        await moveTrain(data);
      } else {
        // move train outside and spawn new
        // get width of train 210px * number of elements
        const path = width.value + (210 * (document.getElementById('train')?.children.length ?? 1));
        await moveTrain(data, path + 300);
        // reset left
        left.value.value = 0;
        // continue as usual
        await moveTrain(data);
      }

      animationIsFree = true;
    };

    onMounted(() => {
      console.log('=========== HYPETRAIN ==========');
      setInterval(() => {
        width.value = window.innerWidth;
        if (animationIsFree && events.length > 0) {
          process((events.shift()) as typeof events[number]);
        }
      }, 1000);

      getSocket('/services/twitch', true).on('hypetrain-end', () => {
        subs.value = [];
      });

      getSocket('/services/twitch', true).on('hypetrain-update', (data: { level: number, goal: number, total: number, subs: Record<string, string>}) => {
        // process subs first
        for (const username of Object.keys(data.subs)) {
          if (!subs.value.find(o => o.username === username)) {
            subs.value.push({ username, thumbnailUrl: data.subs[username] });
          }
        }
        events.push(data);
      });
    });

    return {
      left, subs, chunk, width,
    };
  },
});
</script>

<style>
#train {
  position: absolute;
  bottom: 0;
  overflow: visible;
  width: max-content;
}

.wiggle {
  animation: wiggle ease-in-out 1s alternate infinite;
  position: relative;
}

.shake {
  animation: shake ease-in-out 1s alternate infinite;
  position: relative;
}

.shadow {
  color: white;
  text-shadow: 2px 2px 4px #000, 0 0 3px #000;;
}

@keyframes wiggle {
  0% {
    transform: rotate(-10deg);
  }
  100% {
    transform: rotate(10deg);
  }
}

@keyframes shake {
  0% {
    transform: translate(5px,0);
  }
  100% {
    transform: translate(-5px,0);
  }
}
</style>
