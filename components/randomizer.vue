<template>
  <div>
    <div
      v-if="isDebug"
      class="debug"
    >
      <json-viewer
        :value="data || {}"
        boxed
        copyable
        :expand-depth="4"
      />
    </div>
    <div id="positionAnchor">
      <div
        v-if="data && data.type === 'tape'"
        style="width: max-content;"
        :style="{
          transform: positionGenerator()
        }"
      >
        <!-- line -->
        <div
          :style="{
            'text-align': 'center',
            'z-index': '9999',
            left: '50%',
            width: '2px',
            height: '50px',
            position: 'absolute',
            margin: 'auto',
            'border-left': '3px solid black',
            'border-right': '3px solid white',
          }"
        />
        <div id="tape">
          <template v-for="loop in (tapeLoops + 5)">
            <div
              v-for="(item, index) in generateItems(data.items)"
              :key="'tape-' + index + '-' + loop"
              :style="{
                'background-color': item.color,
                color: getContrastColor(item.color),
                width: 'fit-content',
                padding: '10px',
                display: 'inline-block',
                'font-size': data.customizationFont.size + 'px',
                'font-weight': data.customizationFont.weight,
                'font-family': data.customizationFont.family,
                'text-shadow': [textStrokeGenerator(data.customizationFont.borderPx, data.customizationFont.borderColor), shadowGenerator(data.customizationFont.shadow)].filter(Boolean).join(', '),
                'transform': position[index] ? position[index] : '',
              }"
            >
              {{ item.name }}
            </div>
          </template>
        </div>
      </div>
      <div v-if="data && data.type === 'simple'">
        <div
          v-for="(item, index) in generateItems(data.items)"
          :key="'simple-' + index"
          style="position: absolute;"
          :style="{
            visibility: showSimpleBlink && index === showSimpleValueIndex ? 'visible' : 'hidden',
            color: item.color,
            'font-size': data.customizationFont.size + 'px',
            'font-weight': data.customizationFont.weight,
            'font-family': data.customizationFont.family,
            'text-shadow': [textStrokeGenerator(data.customizationFont.borderPx, data.customizationFont.borderColor), shadowGenerator(data.customizationFont.shadow)].filter(Boolean).join(', '),
            'transform': position[index] ? position[index] : '',
          }"
        >
          {{ item.name }}
        </div>
      </div>
    </div>
    <div v-if="data && data.type === 'wheelOfFortune'">
      <canvas
        id="canvas"
        width="1920"
        height="1080"
        style="width: 100%; height: 100%;"
        data-responsiveMinWidth="180"
        data-responsiveScaleHeight="true"
        data-responsiveMargin="1"
      >
        Canvas not supported, use another browser.
      </canvas>
      <div
        v-if="wheelWin"
        id="winbox"
        :style="{
          color: getContrastColor(wheelWin.fillStyle),
          'font-weight': data.customizationFont.weight,
          'font-size': (data.customizationFont.size + 15)+ 'px',
          'font-family': data.customizationFont.family,
          'text-align': 'center',
          'background-color': wheelWin.fillStyle, // add alpha
          'text-shadow': [textStrokeGenerator(data.customizationFont.borderPx, data.customizationFont.borderColor), shadowGenerator(data.customizationFont.shadow)].filter(Boolean).join(', ')
        }"
      >
        {{ wheelWin.text }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import type { RandomizerInterface, RandomizerItemInterface } from '@entity/randomizer';
import {
  defineComponent, nextTick, onMounted, ref, useMeta,
} from '@nuxtjs/composition-api';
import Winwheel from '@shubhrank/winwheeljs';
import { getContrastColor } from '@sogebot/ui-helpers/colors';
import { getSocket } from '@sogebot/ui-helpers/socket';
import { shadowGenerator, textStrokeGenerator } from '@sogebot/ui-helpers/text';
import gsap from 'gsap';
import {
  cloneDeep, isEqual, orderBy,
} from 'lodash';
import JsonViewer from 'vue-json-viewer';

declare global {
  interface Window {
    responsiveVoice: any;
  }
}

let _key = '';

export default defineComponent({ // enable useMeta
  components: { JsonViewer },
  setup () {
    const url = new URL(location.href);
    const isDebug = !!url.searchParams.get('debug');

    const loadedFonts = ref([] as string[]);
    const responsiveAPIKey = ref(null as string | null);
    const TTSservice = ref(0 as 0 | 1);
    const TTSenabled = ref(false);
    const isSpeaking = ref(false);
    const data = ref(null as RandomizerInterface | null);

    const showSimpleValueIndex = ref(0);
    const showSimpleSpeed = ref(1); // lower = faster
    const showSimpleBlink = ref(true);
    const showSimpleLoop = ref(0);

    const tapeLoops = ref(0);
    const tapeInProgress = ref(false);

    const theWheel = ref(null as any);
    const wheelWin = ref(null as any);

    const position = ref([] as string[]);

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

    const isTTSPlaying = {
      0: () => typeof window.responsiveVoice !== 'undefined' && window.responsiveVoice.isPlaying(),
      1: () => isSpeaking.value,
    };

    const initResponsiveVoice = () => {
      if (typeof window.responsiveVoice === 'undefined') {
        setTimeout(() => initResponsiveVoice(), 200);
        return;
      }
      window.responsiveVoice.init();
      console.debug('= ResponsiveVoice init OK');
      TTSenabled.value = true;
    };

    const speak = (text: string, voice: string, rate: number, pitch: number, volume: number) => {
      if (!TTSenabled.value) {
        console.error('TTS is not properly set, skipping');
        return;
      }
      if (isTTSPlaying[TTSservice.value]()) {
        // wait and try later
        setTimeout(() => speak(text, voice, rate, pitch, volume), 1000);
        return;
      }

      if (TTSservice.value === 0) {
        // RESPONSIVE VOICE
        window.responsiveVoice.speak(text, voice, {
          rate, pitch, volume,
        });
      } else {
        // GOOGLE
        isSpeaking.value = true;
        getSocket('/core/tts', true).emit('speak', {
          voice, rate, pitch, volume, key: _key, text,
        }, (err, b64mp3) => {
          if (err) {
            isSpeaking.value = false;
            return console.error(err);
          }
          const snd = new Audio(`data:audio/mp3;base64,` + b64mp3);
          snd.play();
          snd.onended = () => (isSpeaking.value = false);
        });
      }
    };

    function getMiddleElement () {
      const clientWidth = window.innerWidth;
      let element: null | HTMLElement = null;
      for (const child of Array.from(document.getElementById('tape')?.children ?? [])) {
        if (child.getBoundingClientRect().x < clientWidth / 2) {
          element = child as HTMLElement;
        } else {
          break;
        }
      }
      return element;
    }

    function blinkElementBackground (element: HTMLElement) {
      const tl = gsap.timeline({ repeat: 4, repeatDelay: 0 });
      tl.to(element, { backgroundColor: 'darkorange' });
      tl.to(element, { backgroundColor: element.style.backgroundColor });
    }

    onMounted(() => {
      console.log('====== RANDOMIZER ======');
      setInterval(() => {
        getSocket('/registries/randomizer', true).emit('randomizer::getVisible', (err, _data) => {
          if (err) {
            return console.error(err);
          }
          if (!_data) {
            data.value = null;
            return;
          }
          if (_data.items.length === 0) {
            console.error('No items detected in your randomizer');
            return;
          }

          const head = document.getElementsByTagName('head')[0];
          const style = document.createElement('style');
          style.type = 'text/css';

          if (!loadedFonts.value.includes(_data.customizationFont.family)) {
            console.debug('Loading font', _data.customizationFont.family);
            loadedFonts.value.push(_data.customizationFont.family);
            const font = _data.customizationFont.family.replace(/ /g, '+');
            const css = '@import url(\'https://fonts.googleapis.com/css?family=' + font + '\');';
            style.appendChild(document.createTextNode(css));
            head.appendChild(style);
            return;
          }

          let shouldReinitWof = false;
          if (!isEqual(_data, data.value)) {
            showSimpleValueIndex.value = Math.floor(Math.random() * generateItems(_data.items as Required<RandomizerItemInterface>[]).length);
            shouldReinitWof = true;
            data.value = _data;
          }

          nextTick(() => {
            if (_data.type === 'simple') {
              positionGenerator();
            }
            if (shouldReinitWof && _data.type === 'wheelOfFortune') {
              function playSound () {
                if (_data.shouldPlayTick) {
                  const audio = new Audio(`${location.origin}/_static/click_wheel.mp3`);
                  audio.volume = _data.tickVolume / 100;
                  audio.play();
                }
              }

              const segments = [];
              for (const option of generateItems(_data.items as Required<RandomizerItemInterface>[])) {
                segments.push({
                  fillStyle: option.color, textFillStyle: getContrastColor(option.color), text: option.name,
                });
              }

              gsap.to(document.getElementById('canvas'), { duration: 1.5, opacity: 1 });
              theWheel.value = new Winwheel({
                numSegments:    generateItems(_data.items as Required<RandomizerItemInterface>[]).length, // Number of segments
                outerRadius:    450, // The size of the wheel.
                centerX:        960, // Used to position on the background correctly.
                centerY:        540,
                textFontSize:   _data.customizationFont.size, // Font size.
                textFontWeight: _data.customizationFont.weight, // Font weight.
                textFontFamily: _data.customizationFont.family, // Font family.
                segments,
                responsive:     true, // This wheel is responsive!
                animation:      // Definition of the animation
                {
                  type:             'spinToStop',
                  duration:         10,
                  spins:            5,
                  easing:           'Back.easeOut.config(4)',
                  callbackFinished: alertPrize,
                  callbackAfter:    drawTriangle,
                  callbackSound:    playSound, // Called when the tick sound is to be played.
                  soundTrigger:     'pin', // Specify pins are to trigger the sound.
                  yoyo:             true,
                },
                pins: // Turn pins on.
                  {
                    number:      12,
                    fillStyle:   'silver',
                    outerRadius: 4,
                  },
              });
              drawTriangle();
            }
          });
        });
      }, 1000);
      getSocket('/registries/randomizer', true).on('spin', ({ service, key }) => {
        // initialize tts
        if (service === 0) {
          responsiveAPIKey.value = key;
        } else {
          responsiveAPIKey.value = null;
          _key = key;
          TTSenabled.value = true;
        }
        TTSservice.value = service;
        spin();
      });
    });

    const alertPrize = () => {
      wheelWin.value = theWheel.value.getIndicatedSegment();
      setTimeout(() => {
        if (data.value && data.value.tts.enabled && wheelWin.value) {
          speak(wheelWin.value.text, data.value.tts.voice, data.value.tts.rate, data.value.tts.pitch, data.value.tts.volume);
        }
      }, 1000);
      setTimeout(() => {
        wheelWin.value = null;
      }, 5000);
    };

    const drawTriangle = () => {
      const ctx = theWheel.value.ctx;
      ctx.strokeStyle = 'navy'; // Set line colour.
      ctx.fillStyle = 'aqua'; // Set fill colour.
      ctx.lineWidth = 2;
      ctx.beginPath(); // Begin path.

      const positionX = 945;
      const positionY = 80;
      ctx.moveTo(positionX, positionY); // Move to initial position.
      ctx.lineTo(positionX + 30, positionY); // Draw lines to make the shape.
      ctx.lineTo(positionX + 15, positionY + 15);
      ctx.lineTo(positionX + 1, positionY);
      ctx.stroke(); // Complete the path by stroking (draw lines).
      ctx.fill(); // Then fill.
    };

    const spin = () => {
      if (data.value !== null) {
        if (data.value.type === 'wheelOfFortune' && theWheel.value) {
          theWheel.value.rotationAngle = theWheel.value.rotationAngle % 360; // reset angle
          theWheel.value.startAnimation();
        }
        if (data.value.type === 'tape') {
          if (tapeInProgress.value) {
            return;
          }
          tapeInProgress.value = true;

          // get initial size of div of 1 loop
          const width = (document.getElementById('tape')?.clientWidth ?? 0) / (tapeLoops.value + 5);

          // add several loops
          const newLoops = Math.floor(Math.random() * 5);
          tapeLoops.value += newLoops;

          // we need to move x loops with last loop random
          const newPos = width * (tapeLoops.value + 1) + Math.floor(Math.random() * width);

          gsap.to(document.getElementById('tape'), {
            x:          -newPos,
            duration:   5 + Math.random() * 5,
            ease:       'ease-out',
            onComplete: () => {
              tapeInProgress.value = false;

              // we need to get element in the middle
              const winnerEl = getMiddleElement();
              if (winnerEl) {
                if (data.value && data.value.tts.enabled) {
                  speak(winnerEl.innerHTML.trim(), data.value.tts.voice, data.value.tts.rate, data.value.tts.pitch, data.value.tts.volume);
                }
                blinkElementBackground(winnerEl);
              }
            },
          });
        }
        if (data.value.type === 'simple') {
          if (showSimpleLoop.value > 0) {
            return; // do nothing if in progress
          }
          showSimpleLoop.value = 500 + Math.floor(Math.random() * generateItems(data.value.items as Required<RandomizerItemInterface>[]).length);
          showSimpleSpeed.value = 1;
          const blink = () => {
            if (showSimpleLoop.value > -10) {
              showSimpleBlink.value = !showSimpleBlink.value;
              showSimpleLoop.value--;
              setTimeout(blink, 100);
            } else {
              showSimpleBlink.value = true;
            }
          };
          const next = () => {
            if (data.value === null) {
              return;
            }
            if (showSimpleLoop.value > 300) {
              showSimpleSpeed.value = 5;
            } else if (showSimpleLoop.value > 80) {
              showSimpleSpeed.value = 10;
            } else if (showSimpleLoop.value > 60) {
              showSimpleSpeed.value = 30;
            } else if (showSimpleLoop.value > 40) {
              showSimpleSpeed.value = 50;
            } else if (showSimpleLoop.value > 30) {
              showSimpleSpeed.value = 75;
            } else if (showSimpleLoop.value > 20) {
              showSimpleSpeed.value = 100;
            } else if (showSimpleLoop.value > 5) {
              showSimpleSpeed.value = 200;
            } else if (showSimpleLoop.value > 2) {
              showSimpleSpeed.value = 500;
            } else {
              showSimpleSpeed.value = 1000;
            }

            showSimpleValueIndex.value++;
            if (typeof generateItems(data.value.items as Required<RandomizerItemInterface>[])[showSimpleValueIndex.value] === 'undefined') {
              showSimpleValueIndex.value = 0;
            }
            showSimpleLoop.value--;
            if (showSimpleLoop.value > 0) {
              setTimeout(next, showSimpleSpeed.value);
            } else {
              setTimeout(() => {
                if (Math.random() > 0.3) {
                  blink();
                  if (data.value && data.value.tts.enabled) {
                    speak(generateItems(data.value.items as Required<RandomizerItemInterface>[])[showSimpleValueIndex.value].name, data.value.tts.voice, data.value.tts.rate, data.value.tts.pitch, data.value.tts.volume);
                  }
                } else {
                  next();
                }
              }, showSimpleSpeed.value); // move one a bit if lucky or not
            }
          };
          next();
        }
      }
    };

    const positionGenerator = () => {
      position.value = [];
      const el = document.getElementById('positionAnchor');
      if (el) {
        if (data.value?.type === 'simple') {
          const child = el.children[0];
          if (child) {
            const child2 = child.children;
            for (let i = 0; i < child2.length; i++) {
              if (child2[i] && data.value) {
                const widthPxPerCent = window.innerWidth / 100;
                const heightPxPerCent = window.innerHeight / 100;

                let top = 0;
                if (data.value.position.anchorY === 'middle') {
                  top = Number(window.getComputedStyle(child2[i]).getPropertyValue('height').replace('px', '')) / 2;
                } else if (data.value.position.anchorY === 'bottom') {
                  top = Number(window.getComputedStyle(child2[i]).getPropertyValue('height').replace('px', ''));
                }

                let left = 0;
                if (data.value.position.anchorX === 'middle') {
                  left = Number(window.getComputedStyle(child2[i]).getPropertyValue('width').replace('px', '')) / 2;
                } else if (data.value.position.anchorX === 'right') {
                  left = Number(window.getComputedStyle(child2[i]).getPropertyValue('width').replace('px', ''));
                }

                position.value[i] = `translate(${(data.value.position.x * widthPxPerCent) - left}px, ${(data.value.position.y * heightPxPerCent) - top}px)`;
              } else {
                position.value[i] = `translate(0, 0)`;
              }
            }
          }
        } else if (data.value?.type === 'tape') {
          const heightPxPerCent = window.innerHeight / 100;
          return `translate(0, ${data.value.position.y * heightPxPerCent}px)`;
        } else {
          return `translate(0, 0)`;
        }
      }
    };

    const generateItems = (items: Required<RandomizerItemInterface>[], generatedItems: Required<RandomizerItemInterface>[] = []) => {
      const beforeItems = cloneDeep(orderBy(items, 'order'));
      items = cloneDeep(orderBy(items, 'order'));
      items = items.filter(o => o.numOfDuplicates > 0);

      const countGroupItems = (item: RandomizerItemInterface, count = 0): number => {
        const child = items.find(o => o.groupId === item.id);
        if (child) {
          return countGroupItems(child, count + 1);
        } else {
          return count;
        }
      };
      const haveMinimalSpacing = (item: Required<RandomizerItemInterface>) => {
        const lastIdx = generatedItems.map(o => o.name).lastIndexOf(item.name);
        const currentIdx = generatedItems.length;
        return lastIdx === -1 || lastIdx + item.minimalSpacing + countGroupItems(item) < currentIdx;
      };
      const addGroupItems = (item: RandomizerItemInterface, generatedItems2: RandomizerItemInterface[]) => {
        const child = items.find(o => o.groupId === item.id);
        if (child) {
          generatedItems2.push(child);
          addGroupItems(child, generatedItems2);
        }
      };

      for (const item of items) {
        if (item.numOfDuplicates > 0 && haveMinimalSpacing(item) && !item.groupId /* is not grouped or is parent of group */) {
          generatedItems.push(item);
          item.numOfDuplicates--;
          addGroupItems(item, generatedItems);
        }
      }

      // run next iteration if some items are still there and that any change was made
      // so we don't have infinite loop when e.g. minimalspacing is not satisfied
      if (items.filter(o => o.numOfDuplicates > 0).length > 0 && !isEqual(items.filter(o => o.numOfDuplicates > 0), beforeItems)) {
        generateItems(items, generatedItems);
      }
      return generatedItems;
    };

    return {
      isDebug,
      data,
      tapeLoops,
      generateItems,
      showSimpleValueIndex,
      showSimpleBlink,
      positionGenerator,
      position,
      wheelWin,
      getContrastColor,
      textStrokeGenerator,
      shadowGenerator,
    };
  },
  head: {},
});
</script>

<style scoped>
  #canvas { opacity: 0; }

  #winbox {
    text-align: center;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 60%;
    height: auto;
  }
</style>
