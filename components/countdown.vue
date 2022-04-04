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

<script setup lang="ts">
import {
  DAY, HOUR, MINUTE, SECOND,
} from '@sogebot/ui-helpers/constants';
import { getSocket } from '@sogebot/ui-helpers/socket';
import { shadowGenerator, textStrokeGenerator } from '@sogebot/ui-helpers/text';
import { defaultsDeep } from 'lodash';
import { v4 } from 'uuid';
import * as workerTimers from 'worker-timers';

import { toBoolean } from '~/../backend/src/helpers/toBoolean';
import TICK from '~/queries/overlays/tick.gql';

const { $graphql } = useNuxtApp();
const props = defineProps({ opts: Object, id: [String, Object] });
const enabled = ref(true);
const route = useRoute();
const threadId = ref('');
const id = computed(() => props.id ? props.id : route.value.params.id);

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

let lastTimeSync = Date.now();
const update = () => {
  if (localStorage.getItem(`countdown-controller-${id.value}`) !== threadId.value) {
    console.debug('Secondary');
    console.debug(localStorage.getItem(`countdown-controller-${id.value}-enabled`));

    if (Date.now() - lastTimeSync > 1000 || !enabled.value) {
      // get when it was set to get offset
      const currentTimeAt = enabled.value
        ? new Date(localStorage.getItem(`countdown-controller-${id.value}-currentTimeAt`) || Date.now()).getTime()
        : Date.now();
      if (lastTimeSync === currentTimeAt) {
        console.debug('No update, setting as controller');
        localStorage.setItem(`countdown-controller-${id.value}`, threadId.value);
      }
      lastTimeSync = currentTimeAt;
      options.value.currentTime = Date.now() - currentTimeAt + Number(localStorage.getItem(`countdown-controller-${id.value}-currentTime`));
    }

    return;
  }
  console.debug('Primary');
  getSocket('/overlays/countdown', true)
    .emit('countdown::update', {
      id:        props.id ? String(props.id) : route.value.params.id,
      isEnabled: enabled.value,
      time:      options.value.currentTime,
    }, (_err: null, data?: { isEnabled: boolean | null, time :string | null }) => {
      if (data) {
        if (data.isEnabled !== null) {
          enabled.value = data.isEnabled;
        }

        localStorage.setItem(`countdown-controller-${id.value}-currentTime`, String(options.value.currentTime));
        localStorage.setItem(`countdown-controller-${id.value}-currentTimeAt`, new Date().toISOString());
        localStorage.setItem(`countdown-controller-${id.value}-enabled`, String(enabled.value));

        if (data.time !== null) {
          options.value.currentTime = data.time;
        }
      }
    });
};

let updateAt = Date.now();
function tick () {
  if (toBoolean(localStorage.getItem(`countdown-controller-${id.value}-enabled`) || false) && options.value.currentTime > 0) {
    let newTime = options.value.currentTime - (Date.now() - updateAt);
    if (newTime < 0) {
      newTime = 0;
    }
    options.value.currentTime = newTime;
  }
  updateAt = Date.now();
  workerTimers.setTimeout(() => {
    tick();
  }, 10);
}

let lastSave = Date.now();
function saveState () {
  if (localStorage.getItem(`countdown-controller-${id.value}`) === threadId.value) {
    localStorage.setItem(`countdown-controller-${id.value}-currentTime`, String(options.value.currentTime));
    localStorage.setItem(`countdown-controller-${id.value}-currentTimeAt`, new Date().toISOString());
    localStorage.setItem(`countdown-controller-${id.value}-enabled`, String(enabled.value));
    if (options.value.isPersistent && Date.now() - lastSave > 10) {
      lastSave = Date.now();
      $graphql.default.request(TICK, {
        id:     id.value,
        millis: Number(options.value.currentTime),
      });
    }
  }
}

onMounted(() => {
  threadId.value = v4();
  console.log(`====== COUNTDOWN (${threadId.value}) ======`);

  // setting as controller (we don't care which one will control, it will be last one to load)
  localStorage.setItem(`countdown-controller-${id.value}`, threadId.value);

  enabled.value = options.value.isStartedOnSourceLoad;
  options.value.time = options.value.isPersistent ? options.value.currentTime : options.value.time;

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
  for (const fontToLoad of [options.value.countdownFont.family, options.value.messageFont.family]) {
    console.debug('Loading font', fontToLoad);
    const fontFamily = fontToLoad.replace(/ /g, '+');
    const css = '@import url(\'https://fonts.googleapis.com/css?family=' + fontFamily + '\');';
    style.appendChild(document.createTextNode(css));
    head.appendChild(style);
  }
});
</script>
