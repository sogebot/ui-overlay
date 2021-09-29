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
    v-html="time"/>
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

export default defineComponent({
  props: { opts: Object, id: [String, Object] },
  setup (props) {
    let animation: null | gsap.core.Tween = null;
    const enabled = ref(true);
    const route = useRoute();
    const options = ref(
      defaultsDeep(props.opts, {
        currentTime:           0,
        isPersistent:          false,
        isStartedOnSourceLoad: true,
        showMilliseconds:      true,
        stopwatchFont:         {
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
      return options.value.stopwatchFont;
    });

    const time = computed(() => {
      const days = Math.floor(options.value.currentTime / DAY);
      const hours = Math.floor((options.value.currentTime - days * DAY) / HOUR);
      const minutes = Math.floor((options.value.currentTime - (days * DAY) - (hours * HOUR)) / MINUTE);
      const seconds = Math.floor((options.value.currentTime - (days * DAY) - (hours * HOUR) - (minutes * MINUTE)) / SECOND);
      let millis: number | string = Math.floor((options.value.currentTime - (days * DAY) - (hours * HOUR) - (minutes * MINUTE) - (seconds * SECOND)) / 10);

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
      getSocket('/overlays/stopwatch', true)
        .emit('stopwatch::update', {
          id:        props.id ? String(props.id) : route.value.params.id,
          isEnabled: enabled.value,
          time:      options.value.currentTime,
        }, (_err: null, data?: { isEnabled: boolean | null, time :string | null }) => {
          if (data) {
            const origEnabled = enabled.value;
            if (data.isEnabled !== null) {
              enabled.value = data.isEnabled;
            }
            if (data.time !== null) {
              options.value.currentTime = data.time;
            }
            if (enabled.value && !origEnabled) {
              tick();
            }
            if (!enabled.value && animation) {
              animation.kill();
            }
          }
        });
    };

    function tick () {
      if (enabled.value) {
        animation = gsap.to(options.value, {
          duration:    1,
          currentTime: options.value.currentTime + 1000,
          roundProps:  'value',
          ease:        'linear',
          onInterrupt: () => {
            saveState();
          },
          onComplete: () => {
            saveState();
            tick();
          },
        });
      }
    }

    function saveState () {
      if (options.value.isPersistent) {
        fetch(`${process.env.isNuxtDev ? 'http://localhost:20000' : location.origin}/api/v1/overlay/${props.id ? props.id : route.value.params.id}/tick/`, {
          method:         'POST', // *GET, POST, PUT, DELETE, etc.
          mode:           'cors', // no-cors, *cors, same-origin
          cache:          'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
          credentials:    'same-origin', // include, *same-origin, omit
          redirect:       'follow', // manual, *follow, error
          headers:        { 'Content-Type': 'application/json' },
          referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
          body:           JSON.stringify({ time: options.value.currentTime }), // body data type must match "Content-Type" header
        });
      }
    }

    onMounted(() => {
      console.log('====== STOPWATCH ======');

      enabled.value = options.value.isStartedOnSourceLoad;
      options.value.currentTime = options.value.isPersistent ? options.value.currentTime : options.value.currentTime;

      if (enabled.value) {
        tick();
      }

      setInterval(() => {
        update();
      }, 100);

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
