<template>
  <div>
    <div
      :style="{
        'text-align': 'center',
        'width': '100%',
        'color': font.color,
        'font-family': font.family,
        'font-weight': font.weight,
        'font-size': font.size + 'px',
        'text-shadow': [textStrokeGenerator(font.borderPx, font.borderColor), shadowGenerator(font.shadow)].filter(Boolean).join(', ')
      }"
      v-html="time"/>
    <v-sparkline
      v-if="options.showProgressGraph"
      :smooth="25"
      :padding="10"
      :gradient="['#f72047', '#ffd200', '#1feaea']"
      :line-width="3"
      :value="times"
      auto-draw
      auto-draw-easing="linear"
    />
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent, onMounted, ref, useRoute,
} from '@nuxtjs/composition-api';
import {
  DAY, HOUR, MINUTE, SECOND,
} from '@sogebot/ui-helpers/constants';
import { getSocket } from '@sogebot/ui-helpers/socket';
import { shadowGenerator, textStrokeGenerator } from '@sogebot/ui-helpers/text';
import gsap from 'gsap';
import { defaultsDeep } from 'lodash';

import { OverlayMapperGroup, OverlayMapperMarathon } from '@entity/overlay.js';

export default defineComponent({
  props: { opts: Object, id: [String, Object] },
  setup (props) {
    let animation: null | gsap.core.Tween = null;
    const route = useRoute();
    const currentTime = ref({ value: 0 });
    const times = ref([] as number[]);
    const avg = computed(() => {
      const sum = times.value.reduce((acc, cur) => acc + cur, 0);
      const length = times.value.length;

      if (!sum && !length) {
        return 0;
      }

      return Math.ceil(sum / length);
    });
    const options = ref(
      defaultsDeep(props.opts, {
        showProgressGraph:      false,
        disableWhenReachedZero: true,
        endTime:                Date.now(),
        maxEndTime:             Date.now() + 24 * HOUR,
        showMilliseconds:       false,
        values:                 {
          sub: {
            tier1: (10 * MINUTE) / SECOND,
            tier2: (15 * MINUTE) / SECOND,
            tier3: (20 * MINUTE) / SECOND,
          },
          resub: {
            tier1: (5 * MINUTE) / SECOND,
            tier2: (7.5 * MINUTE) / SECOND,
            tier3: (10 * MINUTE) / SECOND,
          },
          bits: {
            addFraction: true,
            bits:        100,
            time:        MINUTE / SECOND,
          },
          tips: {
            addFraction: true,
            tips:        1,
            time:        MINUTE / SECOND,
          },
        },
        marathonFont: {
          family:      'PT Sans',
          size:        50,
          borderPx:    1,
          borderColor: '#000000',
          weight:      '500',
          color:       '#ffffff',
          shadow:      [],
        },
      }),
    );
    const font = computed(() => {
      return options.value.marathonFont;
    });

    const time = computed(() => {
      const days = Math.floor(currentTime.value.value / DAY);
      const hours = Math.floor((currentTime.value.value - days * DAY) / HOUR);
      const minutes = Math.floor((currentTime.value.value - (days * DAY) - (hours * HOUR)) / MINUTE);
      const seconds = Math.floor((currentTime.value.value - (days * DAY) - (hours * HOUR) - (minutes * MINUTE)) / SECOND);
      let millis: number | string = Math.floor((currentTime.value.value - (days * DAY) - (hours * HOUR) - (minutes * MINUTE) - (seconds * SECOND)) / 10);

      if (millis < 10) {
        millis = `0${millis}`;
      }

      let output = '';
      if (days > 0) {
        output += `${days}d`;
      }

      output += `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
      if (options.value.showMilliseconds) {
        output += `<small>.${millis}</small>`;
      }
      return output;
    });

    const update = () => {
      getSocket('/overlays/marathon', true)
        .emit('marathon::public', props.id ? String(props.id) : route.value.params.id, (_err: null, data?: Required<OverlayMapperGroup['opts']['items'][number] | OverlayMapperMarathon>) => {
          if (animation) {
            animation.kill();
          }
          if (data) {
            options.value = typeof data.opts === 'string' ? JSON.parse(data.opts) : data.opts;
            animation = gsap.to(currentTime.value, {
              duration:   1,
              value:      Math.max(options.value.endTime - Date.now(), 0),
              roundProps: 'value',
              ease:       'linear',
            });
          }
        });
    };

    onMounted(() => {
      console.log('====== MARATHON ======');

      setInterval(() => {
        update();
      }, 1000);

      setTimeout(() => {
        setInterval(() => {
          times.value.push(currentTime.value.value);
          while (times.value.length > 100) {
            times.value.splice(0, 1);
          }
        }, 100);
      }, 5000);

      // add fonts import
      const head = document.getElementsByTagName('head')[0];
      const style = document.createElement('style');
      style.type = 'text/css';
      for (const fontToLoad of [options.value.marathonFont.family]) {
        console.debug('Loading font', fontToLoad);
        const fontFamily = fontToLoad.replace(/ /g, '+');
        const css = '@import url(\'https://fonts.googleapis.com/css?family=' + fontFamily + '\');';
        style.appendChild(document.createTextNode(css));
        head.appendChild(style);
      }
    });

    return {
      currentTime,
      font,
      options,
      time,
      textStrokeGenerator,
      shadowGenerator,
      times,
      avg,
    };
  },
  head: {},
});
</script>
