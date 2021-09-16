<template>
  <div>
    <div
      v-if="isDebug"
      class="debug"
    >
      <json-viewer
        :value="{data}"
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
          v-if="typeOfMedia.get(runningAlert.alert.soundId) === 'audio'"
          id="audio"
        >
          <source :src="'/api/v1/registry/alerts/media/' + runningAlert.alert.soundId">
        </audio>
        <div
          v-if="runningAlert.isShowing"
          :class="{
            center: !runningAlert.alert.enableAdvancedMode,
            ['layout-' + runningAlert.alert.layout]: true,
          }"
        >
          <template v-if="!runningAlert.alert.enableAdvancedMode">
            <div
              v-if="typeOfMedia.get(runningAlert.alert.imageId) === 'video'"
              :class="{
                center: runningAlert.alert.layout === '3',
                ['animate__' + runningAlert.animation]: shouldAnimate,
              }"
              :style="{
                'visibility': shouldAnimate ? 'visible' : 'hidden',
                'animation-duration': runningAlert.animationSpeed + 'ms',
              }"
              class="animate__animated w-100 pb-3"
            >
              <video
                id="video"
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
                  :src="'/api/v1/registry/alerts/media/' + runningAlert.alert.imageId"
                  type="video/webm"
                >
                Your browser does not support the video tag.
              </video>
            </div>
            <div
              v-else-if="showImage"
              :class="{
                center: runningAlert.alert.layout === '3',
                ['animate__' + runningAlert.animation]: shouldAnimate
              }"
              :style="{
                'visibility': shouldAnimate ? 'visible' : 'hidden',
                'animation-duration': runningAlert.animationSpeed + 'ms',
              }"
              class="animate__animated"
              @error="showImage=false"
            >
              <img
                :src="'/api/v1/registry/alerts/media/' + runningAlert.alert.imageId"
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
            <div
              v-if="runningAlert.isShowingText"
              id="text"
              :class="{
                center: runningAlert.alert.layout === '3',
                ['animate__' + runningAlert.animation]: shouldAnimate,
              }"
              :style="{
                'visibility': shouldAnimate ? 'visible' : 'hidden',
                'text-align': (runningAlert.alert.font ? runningAlert.alert.font.align : data.font.align),
                'animation-duration': runningAlert.animationSpeed + 'ms',
              }"
              class="animate__animated"
            >
              <span
                :style="{
                  'font-family': runningAlert.alert.font ? runningAlert.alert.font.family : data.font.family,
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
                <v-runtime-template :template="prepareMessageTemplate(runningAlert.alert.messageTemplate)" />
              </span>
              <div
                v-if="runningAlert.alert.message && (runningAlert.alert.message.minAmountToShow || 0) <= runningAlert.amount"
                :style="{
                  'width': '30rem',
                  'text-align': runningAlert.alert.message.font ? runningAlert.alert.message.font.align : data.fontMessage.align,
                  'flex': '1 0 0px',
                  'font-family': runningAlert.alert.message.font ? runningAlert.alert.message.font.family : data.fontMessage.family,
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
            <!-- we need to have hidden div to have proper width -->
            <div
              v-else
              :style="{
                'visibility': 'hidden',
              }"
            >
              <span
                :style="{
                  'font-family': runningAlert.alert.font ? runningAlert.alert.font.family : data.font.family,
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
                <v-runtime-template :template="prepareMessageTemplate(runningAlert.alert.messageTemplate)" />
              </span>
              <div
                v-if="runningAlert.alert.message && (runningAlert.alert.message.minAmountToShow || 0) <= runningAlert.amount"
                :style="{
                  'width': '30rem',
                  'text-align': runningAlert.alert.message.font ? runningAlert.alert.message.font.align : data.fontMessage.align,
                  'flex': '1 0 0px',
                  'font-family': runningAlert.alert.message.font ? runningAlert.alert.message.font.family : data.fontMessage.family,
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
          </template>
          <v-runtime-template
            v-else
            :template="preparedAdvancedHTML"
            :template-props="{runningAlert, shouldAnimate, textStrokeGenerator, shadowGenerator, prepareMessageTemplate, withEmotes, showImage}"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">

import {
  defineComponent, nextTick, onMounted, ref, useContext, useMeta,
} from '@nuxtjs/composition-api';
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

import {
  AlertInterface, AlertResubInterface, AlertRewardRedeemInterface, AlertTipInterface, CommonSettingsInterface, EmitData,
} from '.bot/src/database/entity/alert';
import { CacheEmotesInterface } from '.bot/src/database/entity/cacheEmotes';

require('animate.css');

declare global {
  interface Window {
    responsiveVoice: any;
  }
}
let _key = '';

let isTTSPlaying = false;
let cleanupAlert = false;

const alerts: (EmitData & {isTTSMuted: boolean, isSoundMuted: boolean})[] = [];

const haveAvailableAlert = (emitData: EmitData, data: AlertInterface | null) => {
  if (emitData && data) {
    let possibleAlerts = data[emitData.event];

    // select only correct triggered events
    if (emitData.event === 'rewardredeems') {
      possibleAlerts = (possibleAlerts as AlertRewardRedeemInterface[]).filter(o => o.rewardId === emitData.name);
    }
    if (possibleAlerts.length > 0) {
      // filter variants
      possibleAlerts = possibleAlerts.filter((o) => {
        if (!o.enabled) {
          return false;
        }
        if (o.filter && o.filter.items.length > 0) {
          const script = itemsToEvalPart(o.filter.items, o.filter.operator);
          const tierAsNumber = emitData.tier === 'Prime' ? 0 : Number(emitData.tier);
          return safeEval(
            script, {
              username:  emitData.name,
              name:      emitData.name,
              amount:    emitData.amount,
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

      const alert: CommonSettingsInterface | AlertTipInterface | AlertResubInterface | undefined = possibleAlertsWithRandomCount[Math.floor(Math.random() * possibleAlertsWithRandomCount.length)];
      return !!alert;
    }
  }
  return false;
};

export default defineComponent({
  components: {
    JsonViewer,
    VRuntimeTemplate,
    // eslint-disable-next-line vue/no-unused-components
    baffle: () => import('~/components/baffle.vue'), // this is used in VRuntimeTemplate
  },
  middleware: ['isBotStarted'], // enable useMeta
  props:      { opts: Object },
  setup (props) {
    const { $axios } = useContext();

    const url = new URL(location.href);
    const isDebug = !!url.searchParams.get('debug');

    const responsiveAPIKey = ref(null as string | null);

    const loadedFonts = ref([] as string[]);
    const loadedCSS = ref([] as string[]);

    const preparedAdvancedHTML = ref('');
    const typeOfMedia: Map<string, 'audio' | 'image' | 'video' | null> = new Map();
    const sizeOfMedia: Map<string, [width: number, height: number]> = new Map();

    const state = ref({ loaded: ButtonStates.progress as number });

    const id = ref(null as null | string);
    const updatedAt = ref(-1); // force initial load
    const data = ref(null as null | AlertInterface);
    const defaultProfanityList = ref([] as string[]);
    const listHappyWords = ref([] as string[]);
    const emotes = ref([] as CacheEmotesInterface[]);
    const showImage = ref(true);
    const shouldAnimate = ref(false);

    const runningAlert = ref(null as EmitData & {
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
      alert: CommonSettingsInterface | AlertTipInterface | AlertResubInterface;
      isTTSMuted: boolean;
      isSoundMuted: boolean;
    } | null);

    useMeta(() => {
      if (responsiveAPIKey.value && _key !== responsiveAPIKey.value) {
        _key = responsiveAPIKey.value;
        setTimeout(() => {
          initResponsiveVoice();
        }, 1000);
        return {
          script: [
            {
              hid: 'responsivevoice',
              src: 'https://code.responsivevoice.org/responsivevoice.js?key=' + responsiveAPIKey.value,
            },
          ],
        };
      } else {
        return {};
      }
    });

    const initResponsiveVoice = () => {
      if (typeof window.responsiveVoice === 'undefined') {
        setTimeout(() => initResponsiveVoice(), 200);
        return;
      }
      window.responsiveVoice.init();
      console.debug('= ResponsiveVoice init OK');
    };

    const checkResponsiveVoiceAPIKey = () => {
      getSocket('/integrations/responsivevoice', true).emit('get.value', 'key', (err: string | null, value: string) => {
        if (err) {
          console.error(err);
          return;
        }
        if (responsiveAPIKey.value !== value) {
          // unload if values doesn't match
          if (value.trim().length === 0) {
            console.debug('TTS disabled, responsiveVoice key is not set');
          }
        }
        responsiveAPIKey.value = value;
        setTimeout(() => checkResponsiveVoiceAPIKey(), 10000);
      });
    };

    onMounted(() => {
      console.log('====== ALERTS REGISTRY ======');
      checkResponsiveVoiceAPIKey();
      window.setInterval(() => {
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
                  // eslint-disable-next-line no-eval
                  eval(`${runningAlert.value.alert.advancedMode.js}; if (typeof onEnded === 'function') { onEnded() } else { console.log('no onEnded() function found'); }`);
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
              if (!runningAlert.value.alert.advancedMode && runningAlert.value.alert.animationText === 'baffle') {
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
          }

          const audio = document.getElementById('audio') as null | HTMLMediaElement;
          if (runningAlert.value.message && runningAlert.value.waitingForTTS && (typeOfMedia.get(runningAlert.value.alert.soundId) === null || (audio && audio.ended))) {
            let message = runningAlert.value.message;
            if (runningAlert.value.alert.tts.skipUrls) {
              for (const match of message.match(urlRegex({ strict: false })) ?? []) {
                message = message.replace(match, '');
              }
            }
            if (!runningAlert.value.isTTSMuted && !runningAlert.value.isSoundMuted && data.value) {
              if (data.value?.tts === null) {
              // use default values
                console.log('TTS running with default values.');
                speak(message, 'UK English Female', 1, 1, 1);
              } else {
                speak(message, data.value.tts.voice, data.value.tts.rate, data.value.tts.pitch, data.value.tts.volume);
              }
            } else {
              console.log('TTS is muted.');
            }
            runningAlert.value.waitingForTTS = false;
          } else if (!runningAlert.value.message || String(runningAlert.value.message).length === 0) {
            runningAlert.value.waitingForTTS = false;
          }

          if (runningAlert.value.showAt <= Date.now() && !runningAlert.value.soundPlayed) {
            console.debug('playing audio');
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
          }
        }

        if (runningAlert.value === null && alerts.length > 0) {
          showImage.value = true;

          const emitData = alerts.shift();
          if (emitData && data.value) {
            let possibleAlerts = data.value[emitData.event];

            // select only correct triggered events
            if (emitData.event === 'rewardredeems') {
              possibleAlerts = (possibleAlerts as AlertRewardRedeemInterface[]).filter(o => o.rewardId === emitData.name);
            }
            if (possibleAlerts.length > 0) {
            // filter variants
              possibleAlerts = possibleAlerts.filter((o) => {
                if (!o.enabled) {
                  return false;
                }
                if (o.filter && o.filter.items.length > 0) {
                  const script = itemsToEvalPart(o.filter.items, o.filter.operator);
                  const tierAsNumber = emitData.tier === 'Prime' ? 0 : Number(emitData.tier);
                  return safeEval(
                    script,
                    {
                      username:  emitData.name,
                      name:      emitData.name,
                      amount:    emitData.amount,
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
                console.log(refImageClassMatch)
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
                const shadow = (alert.font ? alert.font.shadow : data.value.font.shadow).filter(Boolean).join(', ');

                const messageTemplate = get(alert, 'messageTemplate', '')
                  .replace(/\{name\}/g, '{name:highlight}')
                  .replace(/\{recipient\}/g, '{recipient:highlight}')
                  .replace(/\{amount\}/g, '{amount:highlight}')
                  .replace(/\{monthsName\}/g, '{monthsName:highlight}')
                  .replace(/\{currency\}/g, '{currency:highlight}');
                preparedAdvancedHTML.value
                = preparedAdvancedHTML.value
                    .replace(/\{message\}/g, `
                    <span :style="{
                      'font-family': (runningAlert.alert.message.font ? runningAlert.alert.message.font.family : data.fontMessage.family) + ' !important',
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
                    .replace(/\{name\}/g, emitData.name)
                    .replace(/\{recipient\}/g, emitData.recipient || '')
                    .replace(/\{amount\}/g, String(emitData.amount))
                    .replace(/\{monthsName\}/g, emitData.monthsName)
                    .replace(/\{currency\}/g, emitData.currency)
                    .replace(/\{name:highlight\}/g, `<v-runtime-template :template="prepareMessageTemplate('{name:highlight}')"></v-runtime-template>`)
                    .replace(/\{recipient:highlight\}/g, `<v-runtime-template :template="prepareMessageTemplate('{recipient:highlight}')"></v-runtime-template>`)
                    .replace(/\{amount:highlight\}/g, `<v-runtime-template :template="prepareMessageTemplate('{amount:highlight}')"></v-runtime-template>`)
                    .replace(/\{monthsName:highlight\}/g, `<v-runtime-template :template="prepareMessageTemplate('{monthsName:highlight}')"></v-runtime-template>`)
                    .replace(/\{currency:highlight\}/g, `<v-runtime-template :template="prepareMessageTemplate('{currency:highlight}')"></v-runtime-template>`)
                    .replace('"wrap"', '"wrap-' + alert.id + '"')
                    .replace(/<div.*class="(.*?)".*ref="text">|<div.*ref="text".*class="(.*?)">/gm, '<div ref="text">') // we need to replace id with class with proper id
                    .replace('ref="text"', `
                    v-if="runningAlert.isShowingText"
                    :class="{['animate__' + runningAlert.animation]: shouldAnimate }"
                    class=" animate__animated ${refTextClass}"
                    :style="{
                      'visibility': shouldAnimate ? 'visible' : 'hidden',
                      'animation-duration': runningAlert.animationSpeed + 'ms',
                      'font-family': '${fontFamily}',
                      'font-size': '${fontSize} px',
                      'font-weight': '${fontWeight}',
                      'color': '${fontColor}',
                      'text-shadow': [
                        textStrokeGenerator(
                          '${shadowBorderPx}',
                          '${shadowBorderColor}',
                        ),
                        shadowGenerator(${shadow})
                      ]
                    }"
                  `)
                    .replace(/<div.*class="(.*?)".*ref="image">|<div.*ref="image".*class="(.*?)">/gm, '<div ref="image">') // we need to replace id with class with proper id
                    .replace('ref="image"', `
                    v-if="runningAlert.isShowingText && showImage"
                    @error="showImage=false"
                    :class="{['animate__' + runningAlert.animation]: shouldAnimate}"
                    :style="{
                      'visibility': shouldAnimate ? 'visible' : 'hidden',
                      'animation-duration': runningAlert.animationSpeed + 'ms'
                    }"
                    class="animate__animated ${refImageClass}"
                    :src="'/api/v1/registry/alerts/media/' + runningAlert.alert.imageId"
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

                // eval JS
                nextTick(() => {
                // eval onStarted
                  nextTick(() => {
                    if (alert && alert.enableAdvancedMode) {
                      // eslint-disable-next-line no-eval
                      eval(`${alert.advancedMode.js}; if (typeof onStarted === 'function') { onStarted() } else { console.log('no onStarted() function found'); }`);
                    }
                  });
                });
              } else {
              // we need to add :highlight to name, amount, monthName, currency by default
                alert.messageTemplate = alert.messageTemplate
                  .replace(/\{name\}/g, '{name:highlight}')
                  .replace(/\{recipient\}/g, '{recipient:highlight}')
                  .replace(/\{amount\}/g, '{amount:highlight}')
                  .replace(/\{monthName\}/g, '{monthName:highlight}')
                  .replace(/\{currency\}/g, '{currency:highlight}');
              }

              const isAmountForTTSInRange = alert.tts.minAmountToPlay <= emitData.amount;
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
                waitingForTTS:  alert.tts.enabled && isAmountForTTSInRange && typeof window.responsiveVoice !== 'undefined',
                alert,
                ...emitData,
              };
            } else {
              runningAlert.value = null;
            }
          } else {
            runningAlert.value = null;
          }
        }
      }, 100);

      id.value = props.opts?.id;
      refreshAlert();
      setInterval(() => refreshAlert(), 10000);

      getSocket('/registries/alerts', true).on('skip', () => {
        if (runningAlert.value) {
          console.log('Skipping playing alert');
          runningAlert.value = null;
          if (typeof window.responsiveVoice !== 'undefined') {
            window.responsiveVoice.cancel();
          }
        } else {
          console.log('No alert to skip');
        }
      });

      getSocket('/registries/alerts', true).on('alert', (data2: (EmitData & {isTTSMuted: boolean, isSoundMuted: boolean })) => {
        console.debug('Incoming alert', data2);

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

        if (data.value && ['tips', 'cheers', 'resubs', 'subs'].includes(data2.event) && runningAlert.value && data.value.parry.enabled && haveAvailableAlert(data2, data.value)) {
          alerts.push(data2);
          console.log('Skipping playing alert - parrying enabled');
          setTimeout(() => {
            runningAlert.value = null;
            if (typeof window.responsiveVoice !== 'undefined') {
              window.responsiveVoice.cancel();
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
          ? runningAlert.value.alert.animationOutDuration
          : runningAlert.value.alert.animationInDuration;
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
      for (const TTS of text.split('/ ')) {
        await new Promise<void>((resolve) => {
          if (TTS.trim().length === 0) {
            setTimeout(() => resolve(), 500);
          } else {
            window.responsiveVoice.speak(TTS, voice, {
              rate, pitch, volume, onend: () => setTimeout(() => resolve(), 500),
            });
          }
        });
      }
      isTTSPlaying = false;
    };

    const refreshAlert = () => {
      getSocket('/registries/alerts', true).emit('isAlertUpdated', { updatedAt: updatedAt.value, id: id.value }, async (err: Error | null, isUpdated: boolean, updatedAt2: number) => {
        if (err) {
          return console.error(err);
        }

        if (isUpdated && updatedAt.value > 0) {
          location.reload(); // reload full page to be sure we have latest alert version
        }

        if (isUpdated && updatedAt.value === -1) {
          console.debug('Alert is loading...');
          updatedAt.value = updatedAt2;
          await new Promise<void>((resolve) => {
            $axios.get<AlertInterface>(`${process.env.isNuxtDev ? 'http://localhost:20000' : location.origin}/api/v1/registry/alerts/${id.value}`)
              .catch(err2 => console.error(err2))
              .then(async (response) => {
                if (!response) {
                  return;
                }
                try {
                  if (runningAlert.value !== null) {
                    return; // skip any changes if alert in progress
                  }
                  if (!isEqual(response.data, data.value)) {
                    data.value = response.data;

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
                    ]) {
                      fetch('/api/v1/registry/alerts/media/' + event.soundId)
                        .then((response2) => {
                          if (!response2.ok) {
                            throw new Error('Network response was not ok');
                          }
                          return response2.blob();
                        })
                        .then(() => {
                          console.log(`Audio ${event.soundId} was found on server.`);
                          typeOfMedia.set(event.soundId, 'audio');
                        })
                        .catch((error) => {
                          typeOfMedia.set(event.soundId, null);
                          console.error(`Audio ${event.soundId} was not found on server.`);
                          console.error(error);
                        });
                      fetch('/api/v1/registry/alerts/media/' + event.imageId)
                        .then(async (response2) => {
                          if (!response2.ok) {
                            throw new Error('Network response was not ok');
                          }
                          const myBlob = await response2.blob();
                          console.log(`${myBlob.type.startsWith('video') ? 'Video' : 'Image'} ${event.imageId} was found on server.`);
                          typeOfMedia.set(event.imageId, myBlob.type.startsWith('video') ? 'video' : 'image');

                          const getMeta = (mediaId: string, type: 'Video' | 'Image') => {
                            if (type === 'Video') {
                              const vid = document.createElement('video');
                              vid.addEventListener('loadedmetadata', (ev) => {
                                const el = ev.target as HTMLVideoElement;
                                sizeOfMedia.set(mediaId, [el.videoWidth, el.videoHeight]);
                              });
                              vid.src = `/api/v1/registry/alerts/media/${mediaId}`;
                            } else {
                              const img = new Image();
                              img.addEventListener('load', (ev) => {
                                const el = ev.target as HTMLImageElement;
                                sizeOfMedia.set(mediaId, [el.naturalWidth, el.naturalHeight]);
                              });
                              img.src = `/api/v1/registry/alerts/media/${mediaId}`;
                            }
                          };
                          getMeta(event.imageId, myBlob.type.startsWith('video') ? 'Video' : 'Image');
                        })
                        .catch((error) => {
                          console.error(error);
                          typeOfMedia.set(event.imageId, null);
                          console.error(`Image/Video ${event.imageId} was not found on server.`);
                        });
                    }
                    for (const [lang, isEnabled] of Object.entries(data.value.loadStandardProfanityList)) {
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
                      ...response.data.customProfanityList.split(',').map(o => o.trim()),
                    ].filter(o => o.trim().length > 0);

                    state.value.loaded = ButtonStates.success;

                    const head = document.getElementsByTagName('head')[0];
                    const style = document.createElement('style');
                    style.type = 'text/css';
                    for (const event of [
                      ...response.data.cheers,
                      ...response.data.follows,
                      ...response.data.hosts,
                      ...response.data.raids,
                      ...response.data.resubs,
                      ...response.data.subgifts,
                      ...response.data.subs,
                      ...response.data.tips,
                      ...response.data.cmdredeems,
                      ...response.data.rewardredeems,
                    ]) {
                      const fontFamily = event.font ? event.font.family : data.value.font.family;
                      if (!loadedFonts.value.includes(fontFamily)) {
                        console.debug('Loading font', fontFamily);
                        loadedFonts.value.push(fontFamily);
                        const font = fontFamily.replace(/ /g, '+');
                        const css = '@import url(\'https://fonts.googleapis.com/css?family=' + font + '\');';
                        style.appendChild(document.createTextNode(css));
                      }
                      if (typeof (event as AlertTipInterface).message !== 'undefined' && !loadedFonts.value.includes(fontFamily)) {
                        console.debug('Loading font', fontFamily);
                        loadedFonts.value.push(fontFamily);
                        const font = ((event as AlertTipInterface).message.font ? (event as any).message.font.family : data.value.fontMessage.family).replace(/ /g, '+');
                        const css = '@import url(\'https://fonts.googleapis.com/css?family=' + font + '\');';
                        style.appendChild(document.createTextNode(css));
                      }
                    }
                    head.appendChild(style);

                    // load emotes
                    // eslint-disable-next-line promise/param-names
                    await new Promise((done) => {
                      getSocket('/core/emotes', true).emit('getCache', (err3: string | null, data3: any) => {
                        if (err3) {
                          return console.error(err3);
                        }
                        emotes.value = data3;
                        console.debug('= Emotes loaded');
                        done(true);
                      });
                    });

                    console.debug('== alerts ready ==');
                    resolve();
                  }
                } catch (e) {
                  console.error({ data });
                  console.error(e);
                }
              });
          });
        }
      });
    };

    const prepareMessageTemplate = (msg: string) => {
      if (runningAlert.value !== null) {
        let name: string | string[] = runningAlert.value.name.split('').map((char, index) => {
          if (runningAlert.value !== null) {
            return `<div class="animate__animated animate__infinite animate__${runningAlert.value.alert.animationText} animate__${runningAlert.value.alert.animationTextOptions.speed}" style="animation-delay: ${index * 50}ms; color: ${runningAlert.value.alert.font ? runningAlert.value.alert.font.highlightcolor : data.value?.font.highlightcolor}; display: inline-block;">${char}</div>`;
          } else {
            return char;
          }
        });
        let recipient: string | string[] = (runningAlert.value.recipient || '').split('').map((char, index) => {
          if (runningAlert.value !== null) {
            return `<div class="animate__animated animate__infinite animate__${runningAlert.value.alert.animationText} animate__${runningAlert.value.alert.animationTextOptions.speed}" style="animation-delay: ${index * 50}ms; color: ${runningAlert.value.alert.font ? runningAlert.value.alert.font.highlightcolor : data.value?.font.highlightcolor}; display: inline-block;">${char}</div>`;
          } else {
            return char;
          }
        });

        let amount: string | string[] = String(runningAlert.value.amount).split('').map((char, index) => {
          if (runningAlert.value !== null) {
            return `<div class="animate__animated animate__infinite animate__${runningAlert.value.alert.animationText} animate__${runningAlert.value.alert.animationTextOptions.speed}" style="animation-delay: ${index * 50}ms; color: ${runningAlert.value.alert.font ? runningAlert.value.alert.font.highlightcolor : data.value?.font.highlightcolor}; display: inline-block;">${char}</div>`;
          } else {
            return char;
          }
        });

        let currency: string | string[] = String(runningAlert.value.currency).split('').map((char, index) => {
          if (runningAlert.value !== null) {
            return `<div class="animate__animated animate__infinite animate__${runningAlert.value.alert.animationText} animate__${runningAlert.value.alert.animationTextOptions.speed}" style="animation-delay: ${index * 50}ms; color: ${runningAlert.value.alert.font ? runningAlert.value.alert.font.highlightcolor : data.value?.font.highlightcolor}; display: inline-block;">${char}</div>`;
          } else {
            return char;
          }
        });

        let monthsName: string | string[] = String(runningAlert.value.monthsName).split('').map((char, index) => {
          if (runningAlert.value !== null) {
            return `<div class="animate__animated animate__infinite animate__${runningAlert.value.alert.animationText} animate__${runningAlert.value.alert.animationTextOptions.speed}" style="animation-delay: ${index * 50}ms; color: ${runningAlert.value.alert.font ? runningAlert.value.alert.font.highlightcolor : data.value?.font.highlightcolor}; display: inline-block;">${char}</div>`;
          } else {
            return char;
          }
        });

        if (runningAlert.value.alert.animationText === 'baffle') {
          let maxTimeToDecrypt = runningAlert.value.alert.animationTextOptions.maxTimeToDecrypt;
          // set maxTimeToDecrypt 0 if fading out to not reset decryption
          if (runningAlert.value.hideAt - Date.now() <= 0
          && !isTTSPlaying
          && !runningAlert.value.waitingForTTS) {
            maxTimeToDecrypt = 0;
          }
          name = `<baffle :key="'name-' + runningAlert.name" :text="runningAlert.name" :options="{...runningAlert.alert.animationTextOptions, maxTimeToDecrypt: ${maxTimeToDecrypt}}" style="color: ${runningAlert.value.alert.font ? runningAlert.value.alert.font.highlightcolor : data.value?.font.highlightcolor}"/>`;
          recipient = `<baffle :key="'recipient-' + runningAlert.recipient" :text="runningAlert.recipient" :options="{...runningAlert.alert.animationTextOptions, maxTimeToDecrypt: ${maxTimeToDecrypt}}" style="color: ${runningAlert.value.alert.font ? runningAlert.value.alert.font.highlightcolor : data.value?.font.highlightcolor}"/>`;
          amount = `<baffle :key="'amount-' + runningAlert.amount" :text="String(runningAlert.amount)" :options="{...runningAlert.alert.animationTextOptions, maxTimeToDecrypt: ${maxTimeToDecrypt}}" style="color: ${runningAlert.value.alert.font ? runningAlert.value.alert.font.highlightcolor : data.value?.font.highlightcolor}"/>`;
          currency = `<baffle :key="'currency-' + runningAlert.currency" :text="runningAlert.currency" :options="{...runningAlert.alert.animationTextOptions, maxTimeToDecrypt: ${maxTimeToDecrypt}}" style="color: ${runningAlert.value.alert.font ? runningAlert.value.alert.font.highlightcolor : data.value?.font.highlightcolor}"/>`;
          monthsName = `<baffle :key="'monthsName-' + runningAlert.monthsName" :text="runningAlert.monthsName" :options="{...runningAlert.alert.animationTextOptions, maxTimeToDecrypt: ${maxTimeToDecrypt}}" style="color: ${runningAlert.value.alert.font ? runningAlert.value.alert.font.highlightcolor : data.value?.font.highlightcolor}"/>`;
        } else {
          name = name.join('');
          recipient = recipient.join('');
          amount = amount.join('');
          currency = currency.join('');
          monthsName = monthsName.join('');
        }
        msg = msg
          .replace(/\{name:highlight\}/g, name)
          .replace(/\{recipient:highlight\}/g, recipient)
          .replace(/\{amount:highlight\}/g, amount)
          .replace(/\{currency:highlight\}/g, currency)
          .replace(/\{monthsName:highlight\}/g, monthsName)
          .replace(/\{name\}/g, runningAlert.value.name)
          .replace(/\{amount\}/g, String(runningAlert.value.amount))
          .replace(/\{currency\}/g, runningAlert.value.currency)
          .replace(/\{monthsName\}/g, runningAlert.value.monthsName);
      }
      return `<span>${msg}</span>`;
    };

    return {
      isDebug,
      data,
      runningAlert,
      state,
      typeOfMedia,
      showImage,
      preparedAdvancedHTML,
      shouldAnimate,

      getSizeOfMedia,
      prepareMessageTemplate,
      textStrokeGenerator,
      shadowGenerator,
      withEmotes,

      ButtonStates,
    };
  },
  head: {},
});
</script>

<style>
  .debug {
    z-index: 9999;
    background-color: rgba(255, 255, 255, 0.5);
    position: absolute;
    color: white;
    padding: 1rem;
  }

  .center {
    position: absolute !important;
    left: 50% !important;
    top: 50% !important;
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
    display: flex !important;
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
