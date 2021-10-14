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
import { useMutation } from '@vue/apollo-composable';
import TICK from '~/queries/overlays/tick.gql';

export default defineComponent({ // enable useMeta
  props: { opts: Object, id: [String, Object] },
  setup (props) {
    let animation: null | gsap.core.Tween = null;
    const enabled = ref(true);
    const route = useRoute();

    const { mutate: tickMutation } = useMutation(TICK);

    const options = ref(
      defaultsDeep(props.opts, {
        time:                       60000,
        currentTime:                60000,
        messageWhenReachedZero:     '',
        isPersistent:               false,
        isStartedOnSourceLoad:      true,
        showMessageWhenReachedZero: false,
        countdownFont:              {
          family:      'PT Sans',
          size:        50,
          borderPx:    1,
          borderColor: '#000000',
          weight:      '500',
          color:       '#ffffff',
          shadow:      [],
        },
        messageFont: {
          family:      'PT Sans',
          size:        35,
          borderPx:    1,
          borderColor: '#000000',
          weight:      '500',
          color:       '#ffffff',
          shadow:      [],
        },
      }),
    );
    const font = computed(() => {
      return options.value.currentTime > 0 || !options.value.showMessageWhenReachedZero
        ? options.value.countdownFont
        : options.value.messageFont;
    });

    const time = computed(() => {
      if (Number(options.value.currentTime) === 0 && options.value.showMessageWhenReachedZero) {
        return options.value.messageWhenReachedZero;
      }
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
      getSocket('/overlays/countdown', true)
        .emit('countdown::update', {
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
              if (animation) {
                animation.kill();
              }
              options.value.currentTime = data.time;
              if (animation) {
                tick() // restart tick
              }
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
      if (enabled.value && options.value.currentTime > 0) {
        let newTime = options.value.currentTime - 1000;
        if (newTime < 0) {
          newTime = 0;
        }
        animation = gsap.to(options.value, {
          duration:    1,
          currentTime: newTime,
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
        tickMutation({
          id:     props.id ? props.id : route.value.params.id,
          millis: options.value.currentTime,
        });
      }
    }

    onMounted(() => {
      console.log('====== COUNTDOWN ======');

      enabled.value = options.value.isStartedOnSourceLoad;
      options.value.time = options.value.isPersistent ? options.value.currentTime : options.value.time;

      if (enabled.value) {
        tick();
      }

      setInterval(() => {
        update();
      }, 500);

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
