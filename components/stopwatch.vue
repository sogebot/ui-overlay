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
    v-html="time"
  />
</template>

<script lang="ts">
import {
  computed,
  defineComponent, onMounted, ref, useRoute,
} from '@nuxtjs/composition-api';
import { toBoolean } from '@sogebot/backend/src/helpers/toBoolean';
import {
  DAY, HOUR, MINUTE, SECOND,
} from '@sogebot/ui-helpers/constants';
import { getSocket } from '@sogebot/ui-helpers/socket';
import { shadowGenerator, textStrokeGenerator } from '@sogebot/ui-helpers/text';
import { useMutation } from '@vue/apollo-composable';
import { defaultsDeep } from 'lodash';
import { v4 } from 'uuid';
import * as workerTimers from 'worker-timers';

import TICK from '~/queries/overlays/tick.gql';

export default defineComponent({
  props: { opts: Object, id: [String, Object] },
  setup (props) {
    const enabled = ref(true);
    const route = useRoute();
    const threadId = ref('');
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

    const { mutate: tickMutation } = useMutation(TICK);

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

    let lastTimeSync = Date.now();
    const update = () => {
      if (localStorage.getItem(`stopwatch-controller-${id.value}`) !== threadId.value) {
        console.debug('Secondary');
        console.debug(localStorage.getItem(`stopwatch-controller-${id.value}-enabled`));

        if (Date.now() - lastTimeSync > 1000 || !enabled.value) {
          lastTimeSync = Date.now();
          // get when it was set to get offset
          const currentTimeAt = enabled.value
            ? new Date(localStorage.getItem(`stopwatch-controller-${id.value}-currentTimeAt`) || Date.now()).getTime()
            : Date.now();
          if (lastTimeSync === currentTimeAt) {
            console.debug('No update, setting as controller');
            localStorage.setItem(`countdown-controller-${id.value}`, threadId.value);
          }
          options.value.currentTime = Date.now() - currentTimeAt + Number(localStorage.getItem(`stopwatch-controller-${id.value}-currentTime`));
        }

        return;
      }
      console.debug('Primary');
      getSocket('/overlays/stopwatch', true)
        .emit('stopwatch::update', {
          id:        id.value,
          isEnabled: enabled.value,
          time:      options.value.currentTime,
        }, (_err: null, data?: { isEnabled: boolean | null, time :string | null }) => {
          if (data) {
            if (data.isEnabled !== null) {
              enabled.value = data.isEnabled;
            }

            localStorage.setItem(`stopwatch-controller-${id.value}-currentTime`, String(options.value.currentTime));
            localStorage.setItem(`stopwatch-controller-${id.value}-currentTimeAt`, new Date().toISOString());
            localStorage.setItem(`stopwatch-controller-${id.value}-enabled`, String(enabled.value));

            if (data.time !== null) {
              options.value.currentTime = data.time;
            }
          }
        });
    };

    let updateAt = Date.now();
    function tick () {
      if (toBoolean(localStorage.getItem(`stopwatch-controller-${id.value}-enabled`) || false)) {
        options.value.currentTime = Number(options.value.currentTime) + (Date.now() - updateAt);
      }
      updateAt = Date.now();
      workerTimers.setTimeout(() => {
        tick();
      }, 10);
    }

    let lastSave = Date.now();
    function saveState () {
      if (localStorage.getItem(`stopwatch-controller-${id.value}`) === threadId.value) {
        localStorage.setItem(`stopwatch-controller-${id.value}-currentTime`, String(options.value.currentTime));
        localStorage.setItem(`stopwatch-controller-${id.value}-currentTimeAt`, new Date().toISOString());
        localStorage.setItem(`stopwatch-controller-${id.value}-enabled`, String(enabled.value));

        if (options.value.isPersistent && Date.now() - lastSave > 10) {
          lastSave = Date.now();
          tickMutation({
            id:     id.value,
            millis: Number(options.value.currentTime),
          });
        }
      }
    }

    const id = computed(() => props.id ? props.id : route.value.params.id);

    onMounted(() => {
      threadId.value = v4();
      console.log(`====== STOPWATCH (${threadId.value}) ======`);

      // setting as controller (we don't care which one will control, it will be last one to load)
      localStorage.setItem(`stopwatch-controller-${id.value}`, threadId.value);

      enabled.value = options.value.isStartedOnSourceLoad;
      options.value.currentTime = options.value.isPersistent ? options.value.currentTime : options.value.currentTime;

      tick();

      workerTimers.setInterval(() => {
        update();
      }, 100);

      workerTimers.setInterval(() => {
        saveState();
      }, 500);

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
