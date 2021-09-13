<template>
  <div
    :style="{
      'position': 'absolute',
      'text-align': 'center',
      'width': '100%',
      'color': font.color,
      'font-family': font.family,
      'font-weight': font.weight,
      'font-size': font.size + 'px',
      'text-shadow': [textStrokeGenerator(font.borderPx, font.borderColor), shadowGenerator(font.shadow)].filter(Boolean).join(', ')
    }"
  >
    {{ time }}
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
import { defaultsDeep } from 'lodash';

export default defineComponent({
  props: { opts: Object, id: [String, Object] },
  setup (props) {
    const enabled = ref(true);
    const route = useRoute();
    const options = ref(
      defaultsDeep(props.opts, {
        currentTime:                       0,
        isPersistent:               false,
        isStartedOnSourceLoad:      true,
        stopwatchFont:              {
          family:      'PT Sans',
          size:        16,
          borderPx:    1,
          borderColor: '#000000',
          weight:      '500',
          color:       '#ffffff',
          shadow:      [],
        },
      }),
    );
    const font = computed(() => {
      return options.value.stopwatchFont;
    });

    const time = computed(() => {
      const days = Math.floor(options.value.currentTime / DAY);
      const hours = Math.floor((options.value.currentTime - days * DAY) / HOUR);
      const minutes = Math.floor((options.value.currentTime - (days * DAY) - (hours * HOUR)) / MINUTE);
      const seconds = Math.floor((options.value.currentTime - (days * DAY) - (hours * HOUR) - (minutes * MINUTE)) / SECOND);

      let output = '';
      if (days > 0) {
        output += `${days}d`;
      }
      output += `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
      return output;
    });

    const update = () => {
      getSocket('/overlays/stopwatch', true)
        .emit('stopwatch::update', {
          id:        props.id ? String(props.id) : route.value.params.id,
          isEnabled: enabled.value,
          time:      options.value.currentTime,
        }, (_err: null, data?: { isEnabled: boolean | null, time :string | null }) => {
          if (data) {
            if (data.isEnabled !== null) {
              enabled.value = data.isEnabled;
            }
            if (data.time !== null) {
              options.value.currentTime = data.time;
            }
          }
        });
    };

    onMounted(() => {
      console.log('====== STOPWATCH ======');

      enabled.value = options.value.isStartedOnSourceLoad;
      options.value.currentTime = options.value.isPersistent ? options.value.currentTime : options.value.currentTime;

      setInterval(() => {
        if (enabled.value) {
          if (options.value.currentTime > 0) {
            options.value.currentTime += 1000;
          }

          if (options.value.isPersistent) {
            fetch(`${process.env.isNuxtDev ? 'http://localhost:20000' : location.origin}/api/v1/overlay/${props.id ? props.id : route.value.params.id}/tick`);
          }
        }

        update();
      }, 1000);

      // add fonts import
      const head = document.getElementsByTagName('head')[0];
      const style = document.createElement('style');
      style.type = 'text/css';
      for (const fontToLoad of [options.value.stopwatchFont.family]) {
        console.debug('Loading font', fontToLoad);
        const fontFamily = fontToLoad.replace(/ /g, '+');
        const css = '@import url(\'https://fonts.googleapis.com/css?family=' + fontFamily + '\');';
        style.appendChild(document.createTextNode(css));
        head.appendChild(style);
      }
    });

    return {
      font,
      options,
      time,
      textStrokeGenerator,
      shadowGenerator,
    };
  },
  head: {},
});
</script>
