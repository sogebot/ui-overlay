<template>
  <div>
    <Head>
      <script v-if="responsiveAPIKey" :src="'https://code.responsivevoice.org/responsivevoice.js?key=' + responsiveAPIKey" hid="responsivevoice"></script>
    </Head>
    <div
      v-if="isDebug"
      class="debug"
    >
      <json-viewer
        :value="{shouldAnimate, data}"
        boxed
        copyable
        :expand-depth="2"
      />
      <json-viewer
        :value="{runningAlert}"
        boxed
        copyable
        :expand-depth="2"
      />
    </div>
    <template v-if="state.loaded === ButtonStates.success && data">
      <div v-if="runningAlert" :key="runningAlert.id">
        <audio
          v-if="runningAlert.alert.soundId && typeOfMedia.get(runningAlert.alert.soundId) === 'audio'"
          id="audio"
        >
          <source :src="link(runningAlert.alert.soundId)">
        </audio>
        <template v-if="runningAlert.isShowing">
          <div
            v-if="!runningAlert.alert.enableAdvancedMode"
            class="center"
            :class="{
              ['layout-' + runningAlert.alert.layout]: true,
            }"
          >
            <div
              v-if="runningAlert.event === 'promo' && runningAlert.user?.profileImageUrl"
              :class="{
                center: runningAlert.alert.layout === '3',
              }"
              :style="{
                'visibility': shouldAnimate ? 'visible' : 'hidden',
              }"
              class=" w-100 pb-3"
            >
              <div
                class="animate__animated"
                :class="{
                  ['animate__' + runningAlert.animation]: shouldAnimate,
                }"
                :style="{'animation-duration': runningAlert.animationSpeed + 'ms'}"
              >
                <div
                  class="animate__animated"
                  :class="{
                    ['animate__' + runningAlert.animation]: shouldAnimate,
                  }"
                  :style="{'animation-duration': runningAlert.animationSpeed + 'ms'}"
                >
                  <img
                    :src="runningAlert.user?.profileImageUrl"
                    :style="{
                      /* center */
                      'display': 'block',
                      'margin-left': 'auto',
                      'margin-right': 'auto',
                      'width': getSizeOfMedia(runningAlert.user?.profileImageUrl, runningAlert.alert.imageOptions.scale / 100, 'width'),
                      'height': getSizeOfMedia(runningAlert.user?.profileImageUrl, runningAlert.alert.imageOptions.scale / 100, 'height'),
                      'transform': 'translate(' + runningAlert.alert.imageOptions.translateX +'px, ' + runningAlert.alert.imageOptions.translateY +'px)',
                    }"
                  >
                </div>
              </div>
            </div>
            <div
              v-else-if="runningAlert.alert.imageId && typeOfMedia.get(runningAlert.alert.imageId) === 'video'"
              :class="{
                center: runningAlert.alert.layout === '3',
              }"
              :style="{
                'visibility': shouldAnimate ? 'visible' : 'hidden',
              }"
              class=" w-100 pb-3"
            >
              <div
                class="animate__animated"
                :class="{
                  ['animate__' + runningAlert.animation]: shouldAnimate,
                }"
                :style="{'animation-duration': runningAlert.animationSpeed + 'ms'}"
              >
                <video
                  id="video"
                  :loop="runningAlert.alert.imageOptions.loop"
                  :style="{
                    /* center */
                    'display': 'block',
                    'margin-left': 'auto',
                    'margin-right': 'auto',
                    'width': getSizeOfMedia(runningAlert.alert.imageId, runningAlert.alert.imageOptions.scale / 100, 'width'),
                    'height': getSizeOfMedia(runningAlert.alert.imageId, runningAlert.alert.imageOptions.scale / 100, 'height'),
                    'transform': 'translate(' + runningAlert.alert.imageOptions.translateX +'px, ' + runningAlert.alert.imageOptions.translateY +'px)',
                  }"
                >
                  <source
                    :src="link(runningAlert.alert.imageId)"
                    type="video/webm"
                  >
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
            <div
              v-else-if="showImage"
              :class="{
                center: runningAlert.alert.layout === '3',
              }"
              :style="{
                'visibility': shouldAnimate ? 'visible' : 'hidden',
              }"
              @error="showImage=false"
            >
              <div
                class="animate__animated"
                :class="{
                  ['animate__' + runningAlert.animation]: shouldAnimate,
                }"
                :style="{'animation-duration': runningAlert.animationSpeed + 'ms'}"
              >
                <img
                  :src="link(runningAlert.alert.imageId)"
                  :style="{
                    /* center */
                    'display': 'block',
                    'margin-left': 'auto',
                    'margin-right': 'auto',
                    'width': getSizeOfMedia(runningAlert.alert.imageId, runningAlert.alert.imageOptions.scale / 100, 'width'),
                    'height': getSizeOfMedia(runningAlert.alert.imageId, runningAlert.alert.imageOptions.scale / 100, 'height'),
                    'transform': 'translate(' + runningAlert.alert.imageOptions.translateX +'px, ' + runningAlert.alert.imageOptions.translateY +'px)',
                  }"
                >
              </div>
            </div>
            <div
              v-if="runningAlert.isShowingText"
              id="text"
              :class="{
                center: runningAlert.alert.layout === '3',
              }"
              :style="{
                'visibility': shouldAnimate ? 'visible' : 'hidden',
                'text-align': (runningAlert.alert.font ? runningAlert.alert.font.align : data.font.align),
              }"
            >
              <div
                class="animate__animated"
                :class="{
                  ['animate__' + runningAlert.animation]: shouldAnimate,
                }"
                :style="{'animation-duration': runningAlert.animationSpeed + 'ms'}"
              >
                <template v-for="(message, idx) in messageTemplatesSplit">
                  <v-runtime-template v-if="idx === messageTemplatesSplitIdx" :key="message" :template="prepareMessageTemplate(message)" :template-props="{runningAlert, shouldAnimate, textStrokeGenerator, shadowGenerator, prepareMessageTemplate, withEmotes, showImage, data, link, encodeFont}" />
                </template>
                <div
                  v-if="runningAlert.alert.message && (runningAlert.alert.message.minAmountToShow || 0) <= runningAlert.amount"
                  :style="{
                    'width': '30rem',
                    'margin': (runningAlert.alert.message.font ? runningAlert.alert.message.font.align : data.fontMessage.align) === 'center' ? 'auto' : 'inherit',
                    'text-align': runningAlert.alert.message.font ? runningAlert.alert.message.font.align : data.fontMessage.align,
                    'flex': '1 0 0px',
                    'font-family': encodeFont(runningAlert.alert.message.font ? runningAlert.alert.message.font.family : data.fontMessage.family),
                    'font-size': (runningAlert.alert.message.font ? runningAlert.alert.message.font.size : data.fontMessage.size) + 'px',
                    'font-weight': runningAlert.alert.message.font ? runningAlert.alert.message.font.weight : data.fontMessage.weight,
                    'color': runningAlert.alert.message.font ? runningAlert.alert.message.font.color : data.fontMessage.color,
                    'text-shadow': textStrokeGenerator(
                      runningAlert.alert.message.font ? runningAlert.alert.message.font.borderPx : data.fontMessage.borderPx,
                      runningAlert.alert.message.font ? runningAlert.alert.message.font.borderColor : data.fontMessage.borderColor
                    )
                  }"
                  v-html="withEmotes(runningAlert.message)"
                />
              </div>
            </div>
            <!-- we need to have hidden div to have proper width -->
            <div
              v-else
              :style="{
                'visibility': 'hidden',
              }"
            >
              <span
                :style="{
                  'font-family': encodeFont(runningAlert.alert.font ? runningAlert.alert.font.family : data.font.family),
                  'font-size': (runningAlert.alert.font ? runningAlert.alert.font.size : data.font.size) + 'px',
                  'font-weight': runningAlert.alert.font ? runningAlert.alert.font.weight : data.font.weight,
                  'color': runningAlert.alert.font ? runningAlert.alert.font.color : data.font.color,
                  'text-shadow': [
                    textStrokeGenerator(
                      runningAlert.alert.font ? runningAlert.alert.font.borderPx : data.font.borderPx,
                      runningAlert.alert.font ? runningAlert.alert.font.borderColor : data.font.borderColor
                    ),
                    shadowGenerator(runningAlert.alert.font ? runningAlert.alert.font.shadow : data.font.shadow)].filter(Boolean).join(', ')
                }"
              >
                <template v-for="(message, idx) in messageTemplatesSplit">
                  <v-runtime-template v-if="idx === messageTemplatesSplitIdx" :key="message" :template="prepareMessageTemplate(message)" :template-props="{runningAlert, shouldAnimate, textStrokeGenerator, shadowGenerator, prepareMessageTemplate, withEmotes, showImage, data, link, encodeFont}" />
                </template>
              </span>
              <div
                v-if="runningAlert.alert.message && (runningAlert.alert.message.minAmountToShow || 0) <= runningAlert.amount"
                :style="{
                  'width': '30rem',
                  'margin': (runningAlert.alert.message.font ? runningAlert.alert.message.font.align : data.fontMessage.align) === 'center' ? 'auto' : 'inherit',
                  'text-align': runningAlert.alert.message.font ? runningAlert.alert.message.font.align : data.fontMessage.align,
                  'flex': '1 0 0px',
                  'font-family': encodeFont(runningAlert.alert.message.font ? runningAlert.alert.message.font.family : data.fontMessage.family),
                  'font-size': runningAlert.alert.message.font ? runningAlert.alert.message.font.size : data.fontMessage.size + 'px',
                  'font-weight': runningAlert.alert.message.font ? runningAlert.alert.message.font.weight : data.fontMessage.weight,
                  'color': runningAlert.alert.message.font ? runningAlert.alert.message.font.color : data.fontMessage.color,
                  'text-shadow': textStrokeGenerator(
                    runningAlert.alert.message.font ? runningAlert.alert.message.font.borderPx : data.fontMessage.borderPx,
                    runningAlert.alert.message.font ? runningAlert.alert.message.font.borderColor : data.fontMessage.borderColor
                  )
                }"
                v-html="withEmotes(runningAlert.message)"
              />
            </div>
            <!-- empty div to mitigate text area -->
          </div>
          <template v-else>
            <div
              :style="{
                'visibility': shouldAnimate ? 'visible' : 'hidden',
                position: 'absolute',
              }"
              class=" w-100 h-100"
            >
              <v-runtime-template
                :template="preparedAdvancedHTML"
                :template-props="{runningAlert, shouldAnimate, textStrokeGenerator, shadowGenerator, prepareMessageTemplate, withEmotes, showImage, data, link, encodeFont}"
              />
            </div>
          </template>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type {
  AlertInterface, AlertResubInterface, AlertRewardRedeemInterface, AlertTipInterface, CommonSettingsInterface, EmitData,
} from '@entity/alert';
import { CacheEmotesInterface } from '@entity/cacheEmotes';
import type { UserInterface } from '@entity/user';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import { itemsToEvalPart } from '@sogebot/ui-helpers/queryFilter';
import { getSocket } from '@sogebot/ui-helpers/socket';
import { shadowGenerator, textStrokeGenerator } from '@sogebot/ui-helpers/text';
import { get, isEqual } from 'lodash';
import safeEval from 'safe-eval';
import urlRegex from 'url-regex';
import { v4 } from 'uuid';
import VRuntimeTemplate from 'v-runtime-template';
import JsonViewer from 'vue-json-viewer';

import GET_ONE from '~/queries/alert/getOne.gql';

require('animate.css');

type RunningAlert = EmitData & {
  id: string;
  animation: string;
  animationSpeed: number;
  animationText: string;
  isShowingText: boolean;
  isShowing: boolean;
  soundPlayed: boolean;
  hideAt: number;
  showTextAt: number;
  showAt: number;
  waitingForTTS: boolean;
  alert: (CommonSettingsInterface | AlertTipInterface | AlertResubInterface) & { ttsTemplate?: string };
  isTTSMuted: boolean;
  isSoundMuted: boolean;
  TTSService: number,
  TTSKey: string,
  caster: null | UserInterface,
  user: null | UserInterface,
  recipientUser: null | UserInterface,
  game?: string,
};

const { $graphql } = useNuxtApp();
const props = defineProps({ opts: Object });

let isTTSPlaying = false;
let cleanupAlert = false;

let snd: HTMLAudioElement; // to be able to parry

const loadedScripts: string[] = [];
const loadedMedia: string[] = [];

const alerts: (EmitData & {
  isTTSMuted: boolean, isSoundMuted: boolean, TTSService: number, TTSKey: string,
  caster: null | UserInterface,
  user: null | UserInterface,
  recipientUser: null | UserInterface,
  game?: string,
})[] = [];

/* eslint-disable */
const triggerFunction = (_____________code: string, _____________fnc: 'onStarted' | 'onEnded', _____________alert: RunningAlert) => {
  const waitMs = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms, null));
  };
  const caster = _____________alert.caster;
  const user = _____________alert.user;
  const recipient = _____________alert.recipientUser;
  eval(
    `(async function() { ${_____________code}; if (typeof ${_____________fnc} === 'function') { console.log('executing ${_____________fnc}()'); await ${_____________fnc}() } else { console.log('no ${_____________fnc}() function found'); } })()`,
  );
};
/* eslint-enable */

const haveAvailableAlert = (emitData: EmitData, data: AlertInterface | null) => {
  if (emitData && data) {
    let possibleAlerts = data[emitData.event];

    // select only correct triggered events
    if (emitData.event === 'rewardredeems') {
      possibleAlerts = (possibleAlerts as AlertRewardRedeemInterface[]).filter(o => o.rewardId === emitData.rewardId);
    }
    if (possibleAlerts.length > 0) {
      // filter variants
      possibleAlerts = possibleAlerts.filter((o) => {
        if (!o.enabled) {
          return false;
        }
        const filter = o.filter ? JSON.parse(o.filter) : null;
        if (filter && filter.items.length > 0) {
          const script = itemsToEvalPart(filter.items, filter.operator);
          const tierAsNumber = emitData.tier === 'Prime' ? 0 : Number(emitData.tier);
          return safeEval(
            script, {
              username:  emitData.name,
              name:      emitData.name,
              game:      emitData.game || '',
              amount:    emitData.amount,
              message:   emitData.message,
              service:   emitData.service,
              tier:      tierAsNumber,
              recipient: emitData.recipient,
            },
          );
        }

        return true;
      });

      // after we have possible alerts -> generate random
      const possibleAlertsWithRandomCount: (CommonSettingsInterface | AlertTipInterface | AlertResubInterface)[] = [];
      // check if exclusive alert is there then run only it (+ other exclusive)
      if (possibleAlerts.find(o => o.variantAmount === 5)) {
        for (const alert of possibleAlerts.filter(o => o.variantAmount === 5)) {
          possibleAlertsWithRandomCount.push(alert);
        }
      } else {
        // randomize variants
        for (const alert of possibleAlerts) {
          for (let i = 0; i < alert.variantAmount; i++) {
            possibleAlertsWithRandomCount.push(alert);
          }
        }
      }

      const alert: CommonSettingsInterface | AlertTipInterface | AlertResubInterface | undefined = possibleAlertsWithRandomCount[Math.floor(Math.random() * possibleAlertsWithRandomCount.length)];
      return !!alert;
    }
  }
  return false;
};

const link = (val: string) => {
  return location.origin + '/gallery/' + val;
};
const url = new URL(location.href);
const isDebug = !!url.searchParams.get('debug');

const responsiveAPIKey = ref(null as string | null);

const loadedFonts = ref([] as string[]);
const loadedCSS = ref([] as string[]);

const preparedAdvancedHTML = ref('');
const typeOfMedia: Map<string, 'audio' | 'image' | 'video' | 'thumbnail' | null> = new Map();
const sizeOfMedia: Map<string, [width: number, height: number]> = new Map();

const state = ref({ loaded: ButtonStates.progress as number });

const id = ref(props.opts?.id as null | string);
const updatedAt = ref(-1); // force initial load
const data = ref(null as null | AlertInterface);
const defaultProfanityList = ref([] as string[]);
const listHappyWords = ref([] as string[]);
const emotes = ref([] as CacheEmotesInterface[]);
const showImage = ref(true);
const shouldAnimate = ref(false);

const messageTemplatesSplit = computed(() => {
  if (runningAlert.value) {
    return runningAlert.value.alert.messageTemplate.split('|').map(o => o.trim());
  } else {
    return [];
  }
});
const messageTemplatesSplitIdx = ref(-1);

watch(shouldAnimate, (val) => {
  if (!val) {
    messageTemplatesSplitIdx.value = -1;
  } else {
    messageTemplatesSplitIdx.value = 0; // this starts splitting
  }
});

watch(messageTemplatesSplitIdx, (val) => {
  if (!runningAlert.value) {
    return;
  }
  if (val > -1) {
    // get num of rows
    const rows = messageTemplatesSplit.value.length;
    const alertDuration = runningAlert.value.hideAt - runningAlert.value.showTextAt;
    const timePerRow = alertDuration / rows;
    if (runningAlert.value.hideAt > Date.now()) {
      setTimeout(() => {
        if (messageTemplatesSplitIdx.value > -1 && messageTemplatesSplitIdx.value < rows - 1) {
          console.log('Showing next row');
          // change only if bigger then -1
          messageTemplatesSplitIdx.value += 1;
        }
      }, timePerRow);
    }
  }
});

const runningAlert = ref(null as RunningAlert | null);

const cache = ref(null as null | AlertInterface[]);

const getMeta = (mediaId: string, type: 'Video' | 'Image' | 'Thumbnail') => {
  if (type === 'Video') {
    const vid = document.createElement('video');
    vid.addEventListener('loadedmetadata', (ev) => {
      const el = ev.target as HTMLVideoElement;
      sizeOfMedia.set(mediaId, [el.videoWidth, el.videoHeight]);
    });
    vid.src = link(mediaId);
  } else if (type === 'Image') {
    const img = new Image();
    img.addEventListener('load', (ev) => {
      const el = ev.target as HTMLImageElement;
      sizeOfMedia.set(mediaId, [el.naturalWidth, el.naturalHeight]);
    });
    img.src = link(mediaId);
  } else {
    const img = new Image();
    img.addEventListener('load', (ev) => {
      const el = ev.target as HTMLImageElement;
      sizeOfMedia.set(mediaId, [el.naturalWidth, el.naturalHeight]);
    });
    img.src = mediaId;
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const refresh = async () => {
  const refreshedAlerts = (await $graphql.default.request(GET_ONE, { id: id.value })).alerts;
  if (!cache.value || cache.value[0].updatedAt !== refreshedAlerts[0].updatedAt) {
    cache.value = refreshedAlerts;
  }
  setTimeout(() => refresh(), 5000);
};

watch(cache, async (value) => {
  if (!value || value.length === 0) {
    return;
  }

  try {
    if (runningAlert.value !== null) {
      return; // skip any changes if alert in progress
    }
    if (!isEqual(value[0], data.value)) {
      data.value = value[0];

      // determinate if image is image or video
      for (const event of [
        ...data.value.subcommunitygifts,
        ...data.value.hosts,
        ...data.value.raids,
        ...data.value.tips,
        ...data.value.cheers,
        ...data.value.resubs,
        ...data.value.subs,
        ...data.value.follows,
        ...data.value.subgifts,
        ...data.value.cmdredeems,
        ...data.value.rewardredeems,
        ...data.value.promo,
      ]) {
        event.soundId = event.soundId === '_default_' ? '_default_audio' : event.soundId;
        event.imageId = event.imageId === '_default_' ? '_default_image' : event.imageId;

        if (event.soundId && !loadedMedia.includes(event.soundId)) {
          loadedMedia.push(event.soundId);
          fetch(link(event.soundId), { headers: { 'Cache-Control': 'max-age=604800' } })
            .then((response2) => {
              if (!response2.ok) {
                throw new Error('Network response was not ok');
              }
              return response2.blob();
            })
            .then(() => {
              console.log(`Audio ${event.soundId} was found on server.`);
              typeOfMedia.set(event.soundId || '', 'audio');
            })
            .catch((error) => {
              typeOfMedia.set(event.soundId || '', null);
              console.error(`Audio ${event.soundId} was not found on server.`);
              console.error(error);
            });
        }
        if (event.imageId && !loadedMedia.includes(event.imageId)) {
          loadedMedia.push(event.imageId);
          fetch(link(event.imageId), { headers: { 'Cache-Control': 'max-age=604800' } })
            .then(async (response2) => {
              if (!response2.ok || !event.imageId) {
                throw new Error('Network response was not ok');
              }
              const myBlob = await response2.blob();
              console.log(`${myBlob.type.startsWith('video') ? 'Video' : 'Image'} ${event.imageId} was found on server.`);
              typeOfMedia.set(event.imageId, myBlob.type.startsWith('video') ? 'video' : 'image');

              if (event.imageId) {
                getMeta(event.imageId, myBlob.type.startsWith('video') ? 'Video' : 'Image');
              }
            })
            .catch((error) => {
              console.error(error);
              typeOfMedia.set(event.imageId || '', null);
              console.error(`Image/Video ${event.imageId} was not found on server.`);
            });
        }
      }
      for (const [lang, isEnabled] of Object.entries(data.value.loadStandardProfanityList)) {
        if (lang.startsWith('_')) {
          continue;
        }
        if (isEnabled) {
          fetch(`${process.env.isNuxtDev ? 'http://localhost:20000' : location.origin}/assets/vulgarities/${lang}.txt`)
            .then(response2 => response2.text())
            .then((text) => {
              defaultProfanityList.value = [...defaultProfanityList.value, ...text.split(/\r?\n/)];
            })
            .catch((e) => {
              console.error(e);
            });

          fetch(`${process.env.isNuxtDev ? 'http://localhost:20000' : location.origin}/assets/happyWords/${lang}.txt`)
            .then(response2 => response2.text())
            .then((text) => {
              listHappyWords.value = [...listHappyWords.value, ...text.split(/\r?\n/)];
            })
            .catch((e) => {
              console.error(e);
            });
        }
      }

      defaultProfanityList.value = [
        ...defaultProfanityList.value,
        ...value[0].customProfanityList.split(',').map(o => o.trim()),
      ].filter(o => o.trim().length > 0);

      state.value.loaded = ButtonStates.success;

      const head = document.getElementsByTagName('head')[0];
      const style = document.createElement('style');
      style.type = 'text/css';
      for (const event of [
        ...value[0].cheers,
        ...value[0].follows,
        ...value[0].hosts,
        ...value[0].raids,
        ...value[0].resubs,
        ...value[0].subgifts,
        ...value[0].subs,
        ...value[0].tips,
        ...value[0].cmdredeems,
        ...value[0].rewardredeems,
        ...value[0].promo,
      ]) {
        const fontFamily = event.font ? event.font.family : data.value.font.family;
        if (!loadedFonts.value.includes(fontFamily)) {
          console.debug('Loading font', fontFamily);
          loadedFonts.value.push(fontFamily);
          const font = fontFamily.replace(/ /g, '+');
          const css = '@import url(\'https://fonts.googleapis.com/css?family=' + font + '\');';
          style.appendChild(document.createTextNode(css));
        }
        const messageFontFamily = (event as AlertTipInterface).message?.font?.family || data.value.fontMessage.family;
        if (typeof (event as AlertTipInterface).message !== 'undefined' && !loadedFonts.value.includes(messageFontFamily)) {
          console.debug('Loading font', messageFontFamily);
          loadedFonts.value.push(messageFontFamily);
          const font = ((event as AlertTipInterface).message.font ? (event as any).message.font.family : data.value.fontMessage.family).replace(/ /g, '+');
          const css = '@import url(\'https://fonts.googleapis.com/css?family=' + font + '\');';
          style.appendChild(document.createTextNode(css));
        }
      }
      head.appendChild(style);

      // load emotes
      // eslint-disable-next-line promise/param-names
      await new Promise((done) => {
        getSocket('/core/emotes', true).emit('getCache', (err3, data3) => {
          if (err3) {
            return console.error(err3);
          }
          emotes.value = data3;
          console.debug('= Emotes loaded');
          done(true);
        });
      });

      console.debug('== alerts ready ==');
    }
  } catch (e) {
    console.error({ data });
    console.error(e);
  }
}, { deep: true, immediate: true });

const isResponsiveVoiceEnabled = () => {
  return new Promise<void>((resolve) => {
    const check = () => {
      if (typeof (window as any).responsiveVoice === 'undefined') {
        setTimeout(() => check(), 200);
      } else {
        console.debug('= ResponsiveVoice init OK');
        (window as any).responsiveVoice.init();
        resolve();
      }
    };
    check();
  });
};

onMounted(() => {
  console.log('====== ALERTS REGISTRY ======');
  refresh();
  window.setInterval(async () => {
    if (runningAlert.value) {
      runningAlert.value.animation = animationClass();
      runningAlert.value.animationSpeed = animationSpeed();
      runningAlert.value.animationText = animationTextClass();

      // cleanup alert after 5s and if responsiveVoice is done
      if (runningAlert.value.hideAt - Date.now() <= 0
          && !isTTSPlaying
          && !runningAlert.value.waitingForTTS) {
        if (!cleanupAlert) {
          console.debug('Cleanin up', {
            isTTSPlaying, waitingForTTS: runningAlert.value.waitingForTTS, hideAt: runningAlert.value.hideAt - Date.now() <= 0,
          });
          // eval onEnded
          nextTick(() => {
            if (runningAlert.value && runningAlert.value.alert.enableAdvancedMode) {
              triggerFunction(runningAlert.value.alert.advancedMode.js || '', 'onEnded', runningAlert.value);
            }
          });

          cleanupAlert = true;
          setTimeout(() => {
            runningAlert.value = null;
            shouldAnimate.value = false;
            cleanupAlert = false;
          }, runningAlert.value.alert.animationOutDuration);
        }
        return;
      } else {
        cleanupAlert = false;
      }

      if (runningAlert.value.showAt <= Date.now() && !runningAlert.value.isShowing) {
        console.debug('showing image');
        runningAlert.value.isShowing = true;

        nextTick(() => {
          const video = document.getElementById('video') as null | HTMLMediaElement;
          if (video && runningAlert.value) {
            if (runningAlert.value.isSoundMuted) {
              video.volume = 0;
              console.log('Audio is muted.');
            } else {
              video.volume = runningAlert.value.alert.soundVolume / 100;
            }
            video.play();
          }
        });
      }

      if (runningAlert.value.showTextAt <= Date.now() && !runningAlert.value.isShowingText) {
        console.debug('showing text');
        runningAlert.value.isShowingText = true;

        (function setTextWidth () {
          if (!runningAlert.value.alert.enableAdvancedMode && runningAlert.value.alert.animationText === 'baffle') {
            const el = document.getElementById('text');
            if (!el) {
              setTimeout(() => setTextWidth());
            } else {
              el.style.width = `${el.clientWidth + 50}px`;
              shouldAnimate.value = true;
            }
          } else {
            shouldAnimate.value = true;
          }
        })();

        if (runningAlert.value.alert.enableAdvancedMode) {
          let evaluated = false;
          const interval = setInterval(() => {
            if (evaluated) {
              clearInterval(interval);
              return;
            }
            if (runningAlert.value) {
              // wait for wrap to be available
              if (!document.getElementById('wrap-' + runningAlert.value.alert.id)) {
                console.log('Wrap element not yet ready to run onStarted, trying again.');
              } else {
                evaluated = true;
                console.log('Wrap element found, triggering onStarted.');

                triggerFunction(runningAlert.value.alert.advancedMode.js || '', 'onStarted', runningAlert.value);
              }
            }
          }, 10);
        }
      }

      const audio = document.getElementById('audio') as null | HTMLMediaElement;
      if (runningAlert.value.message && runningAlert.value.waitingForTTS && (runningAlert.value.alert.soundId === null || (audio && audio.ended))) {
        let message = runningAlert.value.message;
        if (runningAlert.value.alert.tts.skipUrls) {
          for (const match of message.match(urlRegex({ strict: false })) ?? []) {
            message = message.replace(match, '');
          }
        }
        if (!runningAlert.value.isTTSMuted && !runningAlert.value.isSoundMuted && data.value) {
          let ttsTemplate = message;
          if (runningAlert.value.alert.ttsTemplate) {
            ttsTemplate = runningAlert.value.alert.ttsTemplate
              .replace(/\{name\}/g, runningAlert.value.name)
              .replace(/\{game\}/g, runningAlert.value.game || '')
              .replace(/\{recipient\}/g, runningAlert.value.recipient || '')
              .replace(/\{amount\}/g, String(runningAlert.value.amount))
              .replace(/\{monthsName\}/g, runningAlert.value.monthsName)
              .replace(/\{currency\}/g, runningAlert.value.currency)
              .replace(/\{message\}/g, message);
          }
          console.log({ template: runningAlert.value.alert.ttsTemplate, ttsTemplate });

          if (data.value?.tts === null) {
            // use default values
            console.log('TTS running with default values.');
            speak(ttsTemplate, runningAlert.value.TTSService === 0 ? 'UK English Female' : 'en-US-Wavenet-A', 1, 1, 1);
          } else {
            speak(ttsTemplate, data.value.tts.voice, data.value.tts.rate, data.value.tts.pitch, data.value.tts.volume);
          }
        } else {
          console.log('TTS is muted.');
        }
        runningAlert.value.waitingForTTS = false;
      } else if (!runningAlert.value.message || String(runningAlert.value.message).length === 0) {
        runningAlert.value.waitingForTTS = false;
      }

      if (runningAlert.value.showAt <= Date.now() && !runningAlert.value.soundPlayed) {
        if (runningAlert.value.alert.soundId) {
          console.debug('playing audio', runningAlert.value.alert.soundId);
          if (typeOfMedia.get(runningAlert.value.alert.soundId) !== null) {
            if (!audio) {
              console.error('Audio element not found.');
            } else {
              if (runningAlert.value.isSoundMuted) {
                audio.volume = 0;
                console.log('Audio is muted.');
              } else {
                audio.volume = runningAlert.value.alert.soundVolume / 100;
              }
              audio.play();
            }
          }
          runningAlert.value.soundPlayed = true;
        } else {
          console.debug('Audio not set - skipping');
          runningAlert.value.soundPlayed = true;
        }
      }
    }

    if (runningAlert.value === null && alerts.length > 0) {
      showImage.value = true;

      const emitData = alerts.shift();
      if (emitData && data.value) {
        let possibleAlerts = data.value[emitData.event];

        // select only correct triggered events
        if (emitData.event === 'rewardredeems') {
          possibleAlerts = (possibleAlerts as AlertRewardRedeemInterface[]).filter(o => o.rewardId === emitData.rewardId);
        }

        let omitFilters = false;
        if (emitData.event === 'cmdredeems' && emitData.alertId) {
          console.log('Alert is command redeem and triggers', emitData.alertId, 'by force');
          possibleAlerts = possibleAlerts.filter(o => o.id === emitData.alertId);
          omitFilters = true;
        }
        if (possibleAlerts.length > 0) {
          // filter variants
          possibleAlerts = possibleAlerts.filter((o) => {
            if (!o.enabled) {
              return false;
            }
            const filter = o.filter ? JSON.parse(o.filter) : null;
            if (!omitFilters && filter && filter.items.length > 0) {
              const script = itemsToEvalPart(filter.items, filter.operator);
              const tierAsNumber = emitData.tier === 'Prime' ? 0 : Number(emitData.tier);
              return safeEval(
                script,
                {
                  username:  emitData.name,
                  name:      emitData.name,
                  game:      emitData.game || '',
                  amount:    emitData.amount,
                  service:   emitData.service,
                  message:   emitData.message,
                  tier:      tierAsNumber,
                  recipient: emitData.recipient,
                },
              );
            }

            return true;
          });

          // after we have possible alerts -> generate random
          const possibleAlertsWithRandomCount: (CommonSettingsInterface | AlertTipInterface | AlertResubInterface)[] = [];
          // check if exclusive alert is there then run only it (+ other exclusive)
          if (possibleAlerts.find(o => o.variantAmount === 5)) {
            for (const alert of possibleAlerts.filter(o => o.variantAmount === 5)) {
              possibleAlertsWithRandomCount.push(alert);
            }
          } else {
            // randomize variants
            for (const alert of possibleAlerts) {
              for (let i = 0; i < alert.variantAmount; i++) {
                possibleAlertsWithRandomCount.push(alert);
              }
            }
          }

          console.debug({
            emitData, possibleAlerts, possibleAlertsWithRandomCount,
          });

          const alert: CommonSettingsInterface | AlertTipInterface | AlertResubInterface | undefined = possibleAlertsWithRandomCount[Math.floor(Math.random() * possibleAlertsWithRandomCount.length)];
          if (!alert || !alert.id) {
            console.log('No alert found or all are disabled');
            return;
          }

          // advancedMode
          if (alert.enableAdvancedMode) {
            // prepare HTML
            preparedAdvancedHTML.value = alert.advancedMode.html || '';

            const scriptRegex = /<script.*src="(.*)"\/?>/gm;
            let scriptMatch = scriptRegex.exec(preparedAdvancedHTML.value);
            while (scriptMatch !== null) {
              const scriptLink = scriptMatch[1];
              if (loadedScripts.includes(scriptLink)) {
                scriptMatch = scriptRegex.exec(preparedAdvancedHTML.value);
                continue;
              }
              const script = document.createElement('script');
              script.src = scriptLink;
              document.getElementsByTagName('head')[0].appendChild(script);
              scriptMatch = scriptRegex.exec(preparedAdvancedHTML.value);

              // wait for load
              await new Promise((resolve) => {
                script.onload = () => {
                  console.log(`Custom script loaded: ${scriptLink}`);
                  loadedScripts.push(scriptLink);
                  resolve(true);
                };
              });
            }

            // load ref="text" class
            const refTextClassMatch = /<div.*class="(.*?)".*ref="text"|<div.*ref="text".*class="(.*?)"/gm.exec(preparedAdvancedHTML.value);
            let refTextClass = '';
            if (refTextClassMatch) {
              if (refTextClassMatch[1]) {
                refTextClass = refTextClassMatch[1];
              }
              if (refTextClassMatch[2]) {
                refTextClass = refTextClassMatch[2];
              }
              preparedAdvancedHTML.value = preparedAdvancedHTML.value.replace(refTextClassMatch[0], '<div ref="text"');
            }

            // load ref="image" class
            const refImageClassMatch = /<div.*class="(.*?)".*ref="image"|<div.*ref="image".*class="(.*?)"/gm.exec(preparedAdvancedHTML.value);
            let refImageClass = '';
            if (refImageClassMatch) {
              if (refImageClassMatch[1]) {
                refImageClass = refImageClassMatch[1];
              }
              if (refImageClassMatch[2]) {
                refImageClass = refImageClassMatch[2];
              }
              preparedAdvancedHTML.value = preparedAdvancedHTML.value.replace(refImageClassMatch[0], '<div ref="image"');
            }

            const fontFamily = alert.font ? alert.font.family : data.value.font.family;
            const fontSize = alert.font ? alert.font.size : data.value.font.size;
            const fontWeight = alert.font ? alert.font.weight : data.value.font.weight;
            const fontColor = alert.font ? alert.font.color : data.value.font.color;
            const shadowBorderPx = alert.font ? alert.font.borderPx : data.value.font.borderPx;
            const shadowBorderColor = alert.font ? alert.font.borderColor : data.value.font.borderColor;
            const shadow = [textStrokeGenerator(shadowBorderPx, shadowBorderColor), shadowGenerator(alert.font ? alert.font.shadow : data.value.font.shadow)].filter(Boolean).join(', ');

            const messageTemplate = get(alert, 'messageTemplate', '')
              .replace(/\{name\}/g, '{name:highlight}')
              .replace(/\{game\}/g, '{game:highlight}')
              .replace(/\{recipient\}/g, '{recipient:highlight}')
              .replace(/\{amount\}/g, '{amount:highlight}')
              .replace(/\{monthsName\}/g, '{monthsName:highlight}')
              .replace(/\{currency\}/g, '{currency:highlight}');
            preparedAdvancedHTML.value
                = preparedAdvancedHTML.value
                .replace(/\{message\}/g, `
                    <span :style="{
                      'font-family': encodeFont(runningAlert.alert.message.font ? runningAlert.alert.message.font.family : data.fontMessage.family) + ' !important',
                      'font-size': (runningAlert.alert.message.font ? runningAlert.alert.message.font.size : data.fontMessage.size) + 'px !important',
                      'font-weight': (runningAlert.alert.message.font ? runningAlert.alert.message.font.weight : data.fontMessage.weight) + ' !important',
                      'color': (runningAlert.alert.message.font ? runningAlert.alert.message.font.color : data.fontMessage.color) + ' !important',
                      'text-shadow': [
                        textStrokeGenerator(
                          runningAlert.alert.message.font ? runningAlert.alert.message.font.borderPx : data.fontMessage.borderPx,
                          runningAlert.alert.message.font ? runningAlert.alert.message.font.borderColor : data.fontMessage.borderColor
                        ),
                        shadowGenerator(
                          runningAlert.alert.message.font ? runningAlert.alert.message.font.shadow : data.fontMessage.shadow
                        )
                      ].filter(Boolean).join(', ') + ' !important'
                    }"
                    v-html="withEmotes(runningAlert.message)"></span>`)
                .replace(/\{messageTemplate\}/g, messageTemplate)
                .replace(/\{game\}/g, emitData.game || '')
                .replace(/\{name\}/g, emitData.name)
                .replace(/\{recipient\}/g, emitData.recipient || '')
                .replace(/\{amount\}/g, String(emitData.amount))
                .replace(/\{monthsName\}/g, emitData.monthsName)
                .replace(/\{currency\}/g, emitData.currency)
                .replace(/\{game:highlight\}/g, '<span v-html="prepareMessageTemplate(\'{game:highlight}\')"/>')
                .replace(/\{name:highlight\}/g, '<span v-html="prepareMessageTemplate(\'{name:highlight}\')"/>')
                .replace(/\{recipient:highlight\}/g, '<span v-html="prepareMessageTemplate(\'{recipient:highlight}\')"/>')
                .replace(/\{amount:highlight\}/g, '<span v-html="prepareMessageTemplate(\'{amount:highlight}\')"/>')
                .replace(/\{monthsName:highlight\}/g, '<span v-html="prepareMessageTemplate(\'{monthsName:highlight}\')"/>')
                .replace(/\{currency:highlight\}/g, '<span v-html="prepareMessageTemplate(\'{currency:highlight}\')"/>')
                .replace('"wrap"', '"wrap-' + alert.id + '"')
                .replace(/<div.*class="(.*?)".*ref="text">|<div.*ref="text".*class="(.*?)">/gm, '<div ref="text">') // we need to replace id with class with proper id
                .replace('ref="text"', `
                    v-if="runningAlert.isShowingText"
                    class=" ${refTextClass}"
                    :style="{
                      'animation-duration': runningAlert.animationSpeed + 'ms',
                      'font-family': encodeFont('${fontFamily}'),
                      'font-size': '${fontSize} px',
                      'font-weight': '${fontWeight}',
                      'color': '${fontColor}',
                      'text-shadow': '${shadow} !important'
                    }"
                  `)
                .replace(/<div.*class="(.*?)".*ref="image">|<div.*ref="image".*class="(.*?)">/gm, '<div ref="image">') // we need to replace id with class with proper id
                .replace('ref="image"', `
                    v-if="runningAlert.isShowingText && showImage"
                    @error="showImage=false"
                    :style="{
                      'animation-duration': runningAlert.animationSpeed + 'ms'
                    }"
                    class="animate__animated ${refImageClass}"
                    :src="runningAlert.event === 'promo' ? runningAlert.user?.profileImageUrl : link(runningAlert.alert.imageId)"
                  `);

            // load CSS
            if (!loadedCSS.value.includes(alert.id)) {
              console.debug('loaded custom CSS for ' + alert.id);
              loadedCSS.value.push(alert.id);
              const head = document.getElementsByTagName('head')[0];
              const style = document.createElement('style');
              style.type = 'text/css';
              const css = alert.advancedMode.css
                .replace(/#wrap/g, '#wrap-' + alert.id); // replace .wrap with only this goal wrap
              style.appendChild(document.createTextNode(css));
              head.appendChild(style);
            }
          } else {
            // we need to add :highlight to name, amount, monthName, currency by default
            alert.messageTemplate = alert.messageTemplate
              .replace(/\{game\}/g, '{game:highlight}')
              .replace(/\{name\}/g, '{name:highlight}')
              .replace(/\{recipient\}/g, '{recipient:highlight}')
              .replace(/\{amount\}/g, '{amount:highlight}')
              .replace(/\{monthName\}/g, '{monthName:highlight}')
              .replace(/\{currency\}/g, '{currency:highlight}');
          }
          const isAmountForTTSInRange = alert.tts.minAmountToPlay === null || alert.tts.minAmountToPlay <= emitData.amount;
          runningAlert.value = {
            id:             v4(),
            animation:      'none',
            animationText:  'none',
            animationSpeed: 1000,
            soundPlayed:    false,
            isShowing:      false,
            isShowingText:  false,
            showAt:         data.value.alertDelayInMs + Date.now(),
            hideAt:         data.value.alertDelayInMs + Date.now() + alert.alertDurationInMs + alert.animationInDuration,
            showTextAt:     data.value.alertDelayInMs + Date.now() + alert.alertTextDelayInMs,
            waitingForTTS:  alert.tts.enabled && isAmountForTTSInRange,
            alert,
            ...emitData,
          };
        } else {
          console.log('No possible alert found.');
          runningAlert.value = null;
        }
      } else {
        runningAlert.value = null;
      }
    }
  }, 100);

  refreshAlert();
  setInterval(() => refreshAlert(), 10000);

  getSocket('/registries/alerts', true).on('skip', () => {
    if (runningAlert.value) {
      console.log('Skipping playing alert');
      runningAlert.value = null;
      if (typeof (window as any).responsiveVoice !== 'undefined') {
        (window as any).responsiveVoice.cancel();
      }
    } else {
      console.log('No alert to skip');
    }
  });

  getSocket('/registries/alerts', true).on('alert', async (data2) => {
    console.debug('Incoming alert', data2);

    if (data2.TTSService === 0) {
      responsiveAPIKey.value = data2.TTSKey;
      await isResponsiveVoiceEnabled();
    }

    // checking for vulgarities
    if (data2.message && data2.message.length > 0) {
      for (const vulgar of defaultProfanityList.value) {
        if (data.value) {
          if (data.value.profanityFilterType === 'replace-with-asterisk') {
            data2.message = data2.message.replace(new RegExp(vulgar, 'gmi'), '***');
          } else if (data.value.profanityFilterType === 'replace-with-happy-words') {
            data2.message = data2.message.replace(new RegExp(vulgar, 'gmi'), listHappyWords.value[Math.floor(Math.random() * listHappyWords.value.length)]);
          } else if (data.value.profanityFilterType === 'hide-messages') {
            if (data2.message.search(new RegExp(vulgar, 'gmi')) >= 0) {
              console.debug('Message contain vulgarity "' + vulgar + '" and is hidden.');
              data2.message = '';
            }
          } else if (data.value.profanityFilterType === 'disable-alerts') {
            if (data2.message.search(new RegExp(vulgar, 'gmi')) >= 0) {
              console.debug('Message contain vulgarity "' + vulgar + '" and is alert disabled.');
              return;
            }
          }
        }
      }
    }

    if (data2.event === 'promo' && data2.user && data2.user.profileImageUrl) {
      getMeta(data2.user.profileImageUrl, 'Thumbnail');
    }

    if (data.value && ['tips', 'cheers', 'resubs', 'subs'].includes(data2.event) && runningAlert.value && data.value.parry.enabled && haveAvailableAlert(data2, data.value)) {
      alerts.push(data2);
      console.log('Skipping playing alert - parrying enabled');
      setTimeout(() => {
        runningAlert.value = null;
        if (typeof (window as any).responsiveVoice !== 'undefined') {
          (window as any).responsiveVoice.cancel();
        }
        if (snd) {
          snd.pause();
          isTTSPlaying = false;
        }
      }, data.value.parry.delay);
    } else {
      alerts.push(data2);
    }
  });
});

const withEmotes = (text: string | undefined) => {
  if (typeof text === 'undefined' || text.length === 0) {
    return '';
  }
  // checking emotes
  for (const emote of emotes.value) {
    if (get(runningAlert.value, `alert.message.allowEmotes.${emote.type}`, false)) {
      const split: string[] = (text as string).split(' ');
      for (let i = 0; i < split.length; i++) {
        if (split[i] === emote.code) {
          split[i] = `<img src='${emote.urls[1]}' style='position: relative; top: 0.1rem;'/>`;
        }
      }
      text = split.join(' ');
    }
  }
  return text;
};

const getSizeOfMedia = (mediaId: string, scale: number, type: 'height' | 'width') => {
  const [width, height] = sizeOfMedia.get(mediaId) ?? [0, 0];

  if (height === 0 || width === 0) {
    return 'auto';
  }

  if (type === 'height') {
    return `${height * scale}px`;
  } else {
    return `${width * scale}px`;
  }
};

const animationTextClass = () => {
  if (runningAlert.value && runningAlert.value.showTextAt <= Date.now()) {
    return runningAlert.value.hideAt - Date.now() <= 0
        && (!isTTSPlaying || !runningAlert.value.alert.tts.keepAlertShown)
        && !runningAlert.value.waitingForTTS
      ? runningAlert.value.alert.animationOut
      : runningAlert.value.alert.animationIn;
  } else {
    return 'none';
  }
};

const animationSpeed = () => {
  if (runningAlert.value) {
    return runningAlert.value.hideAt - Date.now() <= 0
        && (!isTTSPlaying || !runningAlert.value.alert.tts.keepAlertShown)
        && !runningAlert.value.waitingForTTS
      ? (runningAlert.value.alert.animationOut === 'none' ? 0 : runningAlert.value.alert.animationOutDuration)
      : (runningAlert.value.alert.animationIn === 'none' ? 0 : runningAlert.value.alert.animationInDuration);
  } else {
    return 1000;
  }
};

const animationClass = () => {
  if (runningAlert.value) {
    if (runningAlert.value.hideAt - Date.now() <= 0
        && (!isTTSPlaying || !runningAlert.value.alert.tts.keepAlertShown)
        && !runningAlert.value.waitingForTTS) {
      // animation out
      return runningAlert.value.alert.animationOutDuration === 0 ? 'none' : runningAlert.value.alert.animationOut;
    } else {
      return runningAlert.value.alert.animationInDuration === 0 ? 'none' : runningAlert.value.alert.animationIn;
    }
  } else {
    return 'none';
  }
};

const speak = async (text: string, voice: string, rate: number, pitch: number, volume: number) => {
  isTTSPlaying = true;
  if (runningAlert.value?.TTSService === 0) {
    console.log('Using ResponsiveVoice as TTS Service.');
    for (const TTS of text.split('/ ')) {
      await new Promise<void>((resolve) => {
        if (TTS.trim().length === 0) {
          setTimeout(() => resolve(), 500);
        } else if ((window as any).responsiveVoice) {
          (window as any).responsiveVoice.speak(TTS, voice, {
            rate, pitch, volume, onend: () => setTimeout(() => resolve(), 500),
          });
        } else {
          resolve();
        }
      });
      isTTSPlaying = false;
    }
  } else if (runningAlert.value?.TTSService === 1) {
    console.log('Using Google TTS as TTS Service.');
    getSocket('/registries/alerts', true).emit('speak', {
      volume, pitch, rate, voice, text, key: runningAlert.value.TTSKey,
    }, (err, b64mp3) => {
      if (err) {
        isTTSPlaying = false;
        return console.error(err);
      }
      snd = new Audio(`data:audio/mp3;base64,` + b64mp3);
      snd.play();
      snd.onended = () => (isTTSPlaying = false);
    });
  } else {
    isTTSPlaying = false;
  }
};

const refreshAlert = () => {
  if (!id.value) {
    return;
  }
  getSocket('/registries/alerts', true).emit('isAlertUpdated', { updatedAt: updatedAt.value, id: id.value }, (err: Error | null, isUpdated: boolean, updatedAt2: number) => {
    if (err) {
      return console.error(err);
    }

    if (isUpdated && updatedAt.value > 0) {
      location.reload(); // reload full page to be sure we have latest alert version
    }

    if (isUpdated && updatedAt.value === -1) {
      console.debug('Alert is loading...');
      updatedAt.value = updatedAt2;
      refresh();
    }
  });
};

const prepareMessageTemplate = (msg: string) => {
  if (runningAlert.value !== null) {
    const prepareChar = (char: string, index: number) => {
      if (runningAlert.value !== null) {
        if (char.trim().length === 0) {
          return `<span style="padding-left: ${(runningAlert.value.alert.font?.size ?? 10) * 2}px" />`;
        }
        return `<div class="animate__animated animate__infinite animate__${runningAlert.value.alert.animationText} animate__${runningAlert.value.alert.animationTextOptions.speed}" style="animation-delay: ${index * 50}ms; color: ${runningAlert.value.alert.font ? runningAlert.value.alert.font.highlightcolor : data.value?.font.highlightcolor}; display: inline-block;">${char}</div>`;
      } else {
        return char;
      }
    };

    let game: string | string[] = (runningAlert.value.game || '').split('').map(prepareChar);
    let name: string | string[] = runningAlert.value.name.split('').map(prepareChar);
    let recipient: string | string[] = (runningAlert.value.recipient || '').split('').map(prepareChar);
    let amount: string | string[] = String(runningAlert.value.amount).split('').map(prepareChar);
    let currency: string | string[] = String(runningAlert.value.currency).split('').map(prepareChar);
    let monthsName: string | string[] = String(runningAlert.value.monthsName).split('').map(prepareChar);

    const isFadingOut = runningAlert.value.hideAt - Date.now() <= 0
          && !isTTSPlaying
          && !runningAlert.value.waitingForTTS;

    if (runningAlert.value.alert.animationText === 'baffle') {
      let maxTimeToDecrypt = runningAlert.value.alert.animationTextOptions.maxTimeToDecrypt;
      // set maxTimeToDecrypt 0 if fading out to not reset decryption
      if (isFadingOut) {
        maxTimeToDecrypt = 0;
      }
      game = `<text-animation-baffle :key="'game-' + runningAlert.game" :text="runningAlert.game || ''" :options="{...runningAlert.alert.animationTextOptions, maxTimeToDecrypt: ${maxTimeToDecrypt}}" style="color: ${runningAlert.value.alert.font ? runningAlert.value.alert.font.highlightcolor : data.value?.font.highlightcolor}"/>`;
      name = `<text-animation-baffle :key="'name-' + runningAlert.name" :text="runningAlert.name" :options="{...runningAlert.alert.animationTextOptions, maxTimeToDecrypt: ${maxTimeToDecrypt}}" style="color: ${runningAlert.value.alert.font ? runningAlert.value.alert.font.highlightcolor : data.value?.font.highlightcolor}"/>`;
      recipient = `<text-animation-baffle :key="'recipient-' + runningAlert.recipient" :text="runningAlert.recipient" :options="{...runningAlert.alert.animationTextOptions, maxTimeToDecrypt: ${maxTimeToDecrypt}}" style="color: ${runningAlert.value.alert.font ? runningAlert.value.alert.font.highlightcolor : data.value?.font.highlightcolor}"/>`;
      amount = `<text-animation-baffle :key="'amount-' + runningAlert.amount" :text="String(runningAlert.amount)" :options="{...runningAlert.alert.animationTextOptions, maxTimeToDecrypt: ${maxTimeToDecrypt}}" style="color: ${runningAlert.value.alert.font ? runningAlert.value.alert.font.highlightcolor : data.value?.font.highlightcolor}"/>`;
      currency = `<text-animation-baffle :key="'currency-' + runningAlert.currency" :text="runningAlert.currency" :options="{...runningAlert.alert.animationTextOptions, maxTimeToDecrypt: ${maxTimeToDecrypt}}" style="color: ${runningAlert.value.alert.font ? runningAlert.value.alert.font.highlightcolor : data.value?.font.highlightcolor}"/>`;
      monthsName = `<text-animation-baffle :key="'monthsName-' + runningAlert.monthsName" :text="runningAlert.monthsName" :options="{...runningAlert.alert.animationTextOptions, maxTimeToDecrypt: ${maxTimeToDecrypt}}" style="color: ${runningAlert.value.alert.font ? runningAlert.value.alert.font.highlightcolor : data.value?.font.highlightcolor}"/>`;
    } else if (!isFadingOut && runningAlert.value.alert.animationText === 'typewriter') {
      game = `<text-animation-typewriter :key="'game-' + runningAlert.game" :text="runningAlert.game || ''" :options="{...runningAlert.alert.animationTextOptions}" style="color: ${runningAlert.value.alert.font ? runningAlert.value.alert.font.highlightcolor : data.value?.font.highlightcolor}"/>`;
      name = `<text-animation-typewriter :key="'name-' + runningAlert.name" :text="runningAlert.name" :options="{...runningAlert.alert.animationTextOptions}" style="color: ${runningAlert.value.alert.font ? runningAlert.value.alert.font.highlightcolor : data.value?.font.highlightcolor}"/>`;
      recipient = `<text-animation-typewriter :key="'recipient-' + runningAlert.recipient" :text="runningAlert.recipient" :options="{...runningAlert.alert.animationTextOptions}" style="color: ${runningAlert.value.alert.font ? runningAlert.value.alert.font.highlightcolor : data.value?.font.highlightcolor}"/>`;
      amount = `<text-animation-typewriter :key="'amount-' + runningAlert.amount" :text="String(runningAlert.amount)" :options="{...runningAlert.alert.animationTextOptions}" style="color: ${runningAlert.value.alert.font ? runningAlert.value.alert.font.highlightcolor : data.value?.font.highlightcolor}"/>`;
      currency = `<text-animation-typewriter :key="'currency-' + runningAlert.currency" :text="runningAlert.currency" :options="{...runningAlert.alert.animationTextOptions}" style="color: ${runningAlert.value.alert.font ? runningAlert.value.alert.font.highlightcolor : data.value?.font.highlightcolor}"/>`;
      monthsName = `<text-animation-typewriter :key="'monthsName-' + runningAlert.monthsName" :text="runningAlert.monthsName" :options="{...runningAlert.alert.animationTextOptions}" style="color: ${runningAlert.value.alert.font ? runningAlert.value.alert.font.highlightcolor : data.value?.font.highlightcolor}"/>`;
    } else {
      game = game.join('');
      name = name.join('');
      recipient = recipient.join('');
      amount = amount.join('');
      currency = currency.join('');
      monthsName = monthsName.join('');
    }
    msg = msg
      .replace(/\{game:highlight\}/g, game)
      .replace(/\{name:highlight\}/g, name)
      .replace(/\{recipient:highlight\}/g, recipient)
      .replace(/\{amount:highlight\}/g, amount)
      .replace(/\{currency:highlight\}/g, currency)
      .replace(/\{monthsName:highlight\}/g, monthsName)
      .replace(/\{game\}/g, runningAlert.value.game || '')
      .replace(/\{name\}/g, runningAlert.value.name)
      .replace(/\{amount\}/g, String(runningAlert.value.amount))
      .replace(/\{currency\}/g, runningAlert.value.currency)
      .replace(/\{monthsName\}/g, runningAlert.value.monthsName);
  }

  return `<span
        :style="{
          'font-family': encodeFont(runningAlert.alert.font ? runningAlert.alert.font.family : data.font.family),
          'font-size': (runningAlert.alert.font ? runningAlert.alert.font.size : data.font.size) + 'px',
          'font-weight': runningAlert.alert.font ? runningAlert.alert.font.weight : data.font.weight,
          'color': runningAlert.alert.font ? runningAlert.alert.font.color : data.font.color,
          'text-shadow': [
            textStrokeGenerator(
              runningAlert.alert.font ? runningAlert.alert.font.borderPx : data.font.borderPx,
              runningAlert.alert.font ? runningAlert.alert.font.borderColor : data.font.borderColor
            ),
            shadowGenerator(runningAlert.alert.font ? runningAlert.alert.font.shadow : data.font.shadow)].filter(Boolean).join(', ')
        }"
      >${msg}</span>`;
};

const encodeFont = (font: string) => {
  return `'${font}'`;
};
</script>

<style>
  .debug {
    z-index: 9999;
    background-color: rgb(255 255 255 / 50%);
    position: absolute;
    color: white;
    padding: 1rem;
  }

  .center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) !important;
    width: max-content !important;
  }

  .layout-1 {
    display: flex !important;
    flex-direction: column !important;
  }

  .layout-2 {
    display: flex !important;
    flex-direction: column-reverse !important;
  }

  .layout-3 {
    display: block !important;
  }

  .layout-4 {
    display: flex !important;
    align-items: center !important;
    flex-direction: row-reverse !important;
  }

  .layout-5 {
    display: flex !important;
    align-items: center !important;
    flex-direction: row !important;
  }

  img {
    margin-left: auto;
    margin-right: auto;
  }

  audio {
    visibility: hidden;
    position: absolute;
  }
</style>
