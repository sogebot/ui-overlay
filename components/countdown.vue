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
import { shadowGenerator, textStrokeGenerator } from '@sogebot/ui-helpers/text';
import { defaultsDeep } from 'lodash';

export default defineComponent({ // enable useMeta
  props: { opts: Object },
  setup (props) {
    const enabled = ref(true);
    const route = useRoute();
    const options = ref(
      defaultsDeep(props.opts, {
        time:                       60000,
        messageWhenReachedZero:     '',
        isPersistent:               false,
        isStartedOnSourceLoad:      true,
        showMessageWhenReachedZero: false,
        countdownFont:              {
          family:      'PT Sans',
          size:        16,
          borderPx:    1,
          borderColor: '#000000',
          weight:      '500',
          color:       '#ffffff',
          shadow:      [],
        },
        messageFont: {
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
      return options.value.time > 0 || !options.value.showMessageWhenReachedZero
        ? options.value.countdownFont
        : options.value.messageFont;
    });

    const time = computed(() => {
      if (options.value.time > 0 || !options.value.showMessageWhenReachedZero) {
        const days = Math.floor(options.value.time / DAY);
        const hours = Math.floor((options.value.time - days * DAY) / HOUR);
        const minutes = Math.floor((options.value.time - (days * DAY) - (hours * HOUR)) / MINUTE);
        const seconds = Math.floor((options.value.time - (days * DAY) - (hours * HOUR) - (minutes * MINUTE)) / SECOND);

        let output = '';
        if (days > 0) {
          output += `${days}d`;
        }
        output += `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        return output;
      } else {
        return options.value.messageWhenReachedZero;
      }
    });

    onMounted(() => {
      console.log('====== COUNTDOWN ======');

      enabled.value = options.value.isStartedOnSourceLoad;
      options.value.time = options.value.isPersistent ? options.value.currentTime : options.value.time;

      setInterval(() => {
        if (enabled.value) {
          if (options.value.time > 0) {
            options.value.time -= 1000;
          }

          if (options.value.isPersistent) {
            fetch(`${process.env.isNuxtDev ? 'http://localhost:20000' : location.origin}/api/v1/overlay/${route.value.params.id}/tick`)
          }
          }
      }, 1000);

      // add fonts import
      const head = document.getElementsByTagName('head')[0];
      const style = document.createElement('style');
      style.type = 'text/css';
      for (const fontToLoad of [options.value.countdownFont.family, options.value.messageFont.family]) {
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
