<template>
  <v-app
    v-if="group && $store.state.isUILoaded"
    style="width: 100%; height: 100%"
  >
    <v-main>
      <template v-for="(goal, index) of group.goals">
        <transition
          :key="index"
          :css="false"
          @before-enter="beforeEnter"
          @enter="doEnterAnimation"
          @leave="doLeaveAnimation"
        >
          <v-progress-linear
            v-if="goal.display === 'simple' && (group.goals.length === 1 || show === index || group.display.type === 'multi')"
            :value="(Number(goal.currentAmount) / Number(goal.goalAmount)) * 100"
            :height="goal.customizationBar.height"
            :class="{
              ['color-' + goal.customizationBar.backgroundColor.replace('#', '')]: true,
              disabled: isDisabled(index),
              'position-absolute': group.display.type !== 'multi'
            }"
            :color="goal.customizationBar.color"
            :style="{
              border: goal.customizationBar.borderPx + 'px solid ' + goal.customizationBar.borderColor,
              'margin-top': index !== 0 && group.goals.length > 0 && group.display.type === 'multi' ? group.display.spaceBetweenGoalsInPx + 'px' : '0px'
            }"
          >
            <template #default="{ }">
              <v-row
                no-gutters
                :style="{
                  'position': 'absolute',
                  'width': '100%',
                  'color': goal.customizationFont.color,
                  'font-family': goal.customizationFont.family,
                  'font-weight': goal.customizationFont.weight,
                  'font-size': goal.customizationFont.size + 'px',
                  'text-shadow': [textStrokeGenerator(goal.customizationFont.borderPx, goal.customizationFont.borderColor), shadowGenerator(goal.customizationFont.shadow)].filter(Boolean).join(', ')
                }"
              >
                <v-col cols="4" class="text-no-wrap pl-2" style="text-align: left;">
                  {{ goal.name }}
                </v-col>
                <v-col cols="4" class="text-no-wrap" style="text-align: center;">
                  <template v-if="goal.type === 'tips'">
                    {{ Intl.NumberFormat($store.state.configuration.lang, { style: 'currency', currency: $store.state.configuration.currency }).format(goal.currentAmount) }}
                  </template>
                  <template v-else>
                    {{ goal.currentAmount }}
                  </template>
                </v-col>
                <v-col cols="4" class="text-no-wrap pr-2" style="text-align: right;">
                  <template v-if="goal.type === 'tips'">
                    {{ Intl.NumberFormat($store.state.configuration.lang, { style: 'currency', currency: $store.state.configuration.currency }).format(goal.goalAmount) }}
                  </template>
                  <template v-else>
                    {{ goal.goalAmount }}
                  </template>
                </v-col>
              </v-row>
            </template>
          </v-progress-linear>
          <div
            v-else-if="goal.display === 'full' && (group.goals.length === 1 || group.display.type === 'multi' || show === index)"
            :class="{ disabled: isDisabled(index), 'position-absolute': group.display.type !== 'multi' }"
            style="width: 100%"
            :style="{
              'padding-top': index !== 0 && group.goals.length > 0 && group.display.type === 'multi' ? group.display.spaceBetweenGoalsInPx + 'px' : '0px',
              'font-family': goal.customizationFont.family,
            }"
          >
            <div
              class="row no-gutters"
              :style="{
                'color': goal.customizationFont.color,
                'font-size': goal.customizationFont.size + 'px',
                'text-shadow': [textStrokeGenerator(goal.customizationFont.borderPx, goal.customizationFont.borderColor), shadowGenerator(goal.customizationFont.shadow)].filter(Boolean).join(', ')
              }"
            >
              <div class="col text-center text-truncate pl-2 pr-2">
                {{ goal.name }}
              </div>
            </div>
            <v-progress-linear
              :value="(Number(goal.currentAmount) / Number(goal.goalAmount)) * 100"
              :height="goal.customizationBar.height"
              :class="{
                ['color-' + goal.customizationBar.backgroundColor.replace('#', '')]: true,
                disabled: isDisabled(index),
              }"
              :color="goal.customizationBar.color"
              :style="{
                border: goal.customizationBar.borderPx + 'px solid ' + goal.customizationBar.borderColor,
              }"
            >
              <template #default="{ }">
                <v-row
                  no-gutters
                  :style="{
                    'position': 'absolute',
                    'width': '100%',
                    'color': goal.customizationFont.color,
                    'font-size': goal.customizationFont.size + 'px',
                    'text-shadow': [textStrokeGenerator(goal.customizationFont.borderPx, goal.customizationFont.borderColor), shadowGenerator(goal.customizationFont.shadow)].filter(Boolean).join(', ')
                  }"
                >
                  <v-col v-if="$store.state.configuration" cols="12" class="text-center">
                    <template v-if="goal.type === 'tips'">
                      {{ Intl.NumberFormat($store.state.configuration.lang, { style: 'currency', currency: $store.state.configuration.currency }).format(goal.currentAmount) }}
                      ({{ Intl.NumberFormat($store.state.configuration.lang, { style: 'percent' }).format(goal.currentAmount / goal.goalAmount) }})
                    </template>
                    <template v-else>
                      {{ goal.currentAmount }} ({{ Intl.NumberFormat($store.state.configuration.lang, { style: 'percent' }).format(goal.currentAmount / goal.goalAmount) }})
                    </template>
                  </v-col>
                </v-row>
              </template>
            </v-progress-linear>

            <v-row
              no-gutters
              :style="{
                'position': 'absolute',
                'width': '100%',
                'color': goal.customizationFont.color,
                'font-size': goal.customizationFont.size + 'px',
                'text-shadow': [textStrokeGenerator(goal.customizationFont.borderPx, goal.customizationFont.borderColor), shadowGenerator(goal.customizationFont.shadow)].filter(Boolean).join(', ')
              }"
            >
              <v-col class="text-left pl-2">
                <template v-if="goal.type === 'tips'">
                  {{ Intl.NumberFormat($store.state.configuration.lang, { style: 'currency', currency: $store.state.configuration.currency }).format(0) }}
                </template>
                <template v-else>
                  0
                </template>
              </v-col>
              <v-col
                v-if="!goal.endAfterIgnore"
                cols="auto"
                class="text-truncate text-center text-uppercase pl-2 pr-2"
              >
                {{ dayjs().to(goal.endAfter) }}
              </v-col>
              <v-col class="text-right pr-2">
                <template v-if="goal.type === 'tips'">
                  {{ Intl.NumberFormat($store.state.configuration.lang, { style: 'currency', currency: $store.state.configuration.currency }).format(goal.goalAmount) }}
                </template>
                <template v-else>
                  {{ goal.goalAmount }}
                </template>
              </v-col>
            </v-row>
          </div>
          <div
            v-else-if="goal.display === 'custom' && (group.goals.length === 1 || group.display.type === 'multi' || show === index)"
            :id="'wrap-' + goal.id"
            class="wrap"
            v-html="goal.customizationHtml"
          />
        </transition>
      </template>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import {
  defineComponent, nextTick,
  onMounted, ref, useContext,
} from '@nuxtjs/composition-api';
import { dayjs } from '@sogebot/ui-helpers/dayjsHelper';
import { shadowGenerator, textStrokeGenerator } from '@sogebot/ui-helpers/text';
import gsap from 'gsap';
import { find } from 'lodash';
import safeEval from 'safe-eval';

import { GoalGroupInterface, GoalInterface } from '.bot/src/bot/database/entity/goal';

const bgColors = [] as string[];

export default defineComponent({
  middleware: ['isBotStarted'],
  setup () {
    const show = ref(-1);
    const group = ref(null as GoalGroupInterface | null);
    const loadedFonts = ref([] as string[]);
    const loadedCSS = ref([] as string[]);
    const lastSwapTime = ref(Date.now());
    const triggerUpdate = ref([] as string[]);
    const cssLoaded = ref([] as string[]);
    const current = ref({ subscribers: 0, followers: 0 });

    const { $axios } = useContext();

    onMounted(() => {
      refresh();
      window.setInterval(() => refresh(), 5000);
      window.setInterval(() => {
        if (group.value === null) {
          return;
        }

        if (show.value === -1) {
          return (lastSwapTime.value = Date.now());
        }

        if (group.value.display.type === 'fade') {
          if (lastSwapTime.value + Number(group.value.display.durationMs) < Date.now()) {
            lastSwapTime.value = Date.now() + Number(group.value.display.animationInMs) + Number(group.value.display.animationOutMs);
            if (typeof group.value.goals[show.value + 1] === 'undefined') {
              show.value = 0;
            } else {
              show.value = show.value + 1;
            }
          }
        }
      }, 100);
    });

    const beforeEnter = (el: HTMLElement) => {
      el.style.opacity = '0';
    };

    const doEnterAnimation = (el: HTMLElement, done: () => void) => {
      if (group.value === null) {
        return;
      }
      if (group.value.display.type === 'fade') {
        gsap.to(el, {
          duration:   (group.value.display.animationInMs || 1000) / 1000,
          opacity:    1,
          onComplete: () => {
            done();
          },
        });
      }
    };

    const doLeaveAnimation = (el: HTMLElement, done: () => void) => {
      if (group.value === null) {
        return;
      }
      if (group.value.display.type === 'fade') {
        gsap.to(el, {
          duration:   (group.value.display.animationOutMs || 1000) / 1000,
          opacity:    0,
          onComplete: () => {
            done();
          },
        });
      }
    };

    const isDisabled = (idx: number) => {
      if (group.value === null) {
        return false;
      }

      const goal = group.value.goals[idx];
      return new Date(goal.endAfter).getTime() <= new Date().getTime() && !goal.endAfterIgnore;
    };

    const getFontFamilyCSS = (family: string) => {
      return `"${family}" !important`;
    };

    const refresh = () => {
      const id = window.location.href.split('/')[window.location.href.split('/').length - 1];
      if (id) {
        $axios.get<{ subscribers: number; followers: number; }>(`${location.origin}/api/v1/registry/goals/current`)
          .then((response) => {
            current.value = response.data;
          });
        $axios.get<GoalGroupInterface>(`${location.origin}/api/v1/registry/goals/${id}`)
          .then((response) => {
            group.value = response.data || null;

            if (group.value) {
              for (const goal of group.value.goals) {
                console.log(goal)
                if (!bgColors.includes(goal.customizationBar.backgroundColor)) {
                  bgColors.push(goal.customizationBar.backgroundColor);
                  // create css background colors
                  document.head.insertAdjacentHTML(
                    'beforeend',
                    `<style type="text/css">.color-${goal.customizationBar.backgroundColor.replace('#', '')} .v-progress-linear__background {
                      opacity: 1 !important;
                      background-color: ${goal.customizationBar.backgroundColor} !important;
                    }</style>`,
                  );
                }
              }

              if (group.value.goals.length > 0) {
                for (const goal of group.value.goals) {
                  const _goal = find(group.value.goals, o => o.id === goal.id);
                  if (typeof _goal !== 'undefined') {
                    if (Number(_goal.currentAmount) !== Number(goal.currentAmount)) {
                      console.debug(_goal.currentAmount + ' => ' + goal.currentAmount);
                      triggerUpdate.value.push((goal as Required<GoalInterface>).id);
                    }
                  }
                }
              }

              // update currentAmount for current types
              for (const goal of group.value.goals) {
                if (goal.type === 'currentFollowers') {
                  if (goal.currentAmount !== current.value.followers) {
                    triggerUpdate.value.push((goal as Required<GoalInterface>).id);
                  }
                  goal.currentAmount = current.value.followers;
                }
                if (goal.type === 'currentSubscribers') {
                  if (goal.currentAmount !== current.value.subscribers) {
                    triggerUpdate.value.push((goal as Required<GoalInterface>).id);
                  }
                  goal.currentAmount = current.value.subscribers;
                }
              }

              // add css import
              for (const goal of group.value.goals) {
                if (!cssLoaded.value.includes((goal as Required<GoalInterface>).id)) {
                  cssLoaded.value.push((goal as Required<GoalInterface>).id);
                  const head = document.getElementsByTagName('head')[0];
                  const style = document.createElement('style');
                  style.type = 'text/css';
                  if (!loadedCSS.value.includes(goal.customizationCss)) {
                    loadedCSS.value.push(goal.customizationCss);
                    const css = goal.customizationCss
                      .replace(/#wrap/g, '#wrap-' + goal.id); // replace .wrap with only this goal wrap
                    style.appendChild(document.createTextNode(css));
                  }
                  head.appendChild(style);
                }
              }

              // add fonts import
              const head = document.getElementsByTagName('head')[0];
              const style = document.createElement('style');
              style.type = 'text/css';

              for (const goal of group.value.goals) {
                if (!loadedFonts.value.includes(goal.customizationFont.family)) {
                  console.debug('Loading font', goal.customizationFont.family);
                  loadedFonts.value.push(goal.customizationFont.family);
                  const font = goal.customizationFont.family.replace(/ /g, '+');
                  const css = '@import url(\'https://fonts.googleapis.com/css?family=' + font + '\');';
                  style.appendChild(document.createTextNode(css));
                }
              }
              head.appendChild(style);

              // if custom html update all variables
              for (const goal of group.value.goals) {
                if (goal.display === 'custom') {
                  goal.customizationHtml = goal.customizationHtml
                    .replace(/\$name/g, goal.name)
                    .replace(/\$type/g, goal.type)
                    .replace(/\$goalAmount/g, String(goal.goalAmount))
                    .replace(/\$currentAmount/g, String(goal.currentAmount))
                    .replace(/\$percentageAmount/g, Number((100 / (goal.goalAmount ?? 0)) * (goal.currentAmount ?? 0)).toFixed())
                    .replace(/\$endAfter/g, new Date(goal.endAfter).toISOString());
                }

                // trigger onUpdate on nextTick
                nextTick(() => {
                  if (triggerUpdate.value.includes((goal as Required<GoalInterface>).id)) {
                    const idx = triggerUpdate.value.indexOf((goal as Required<GoalInterface>).id);
                    triggerUpdate.value.splice(idx, 1);

                    console.debug('onUpdate : ' + goal.id);
                    const toEval = `(function evaluation () { ${goal.customizationJs}; onChange(${goal.currentAmount}) })()`;
                    safeEval(toEval);
                  }
                });
              }

              nextTick(() => {
                if (show.value === -1) {
                  show.value = 0;
                }
              });
            }
          });
      } else {
        console.error('Missing id param in url');
      }
    };

    return {
      show,
      group,
      loadedFonts,
      lastSwapTime,
      triggerUpdate,
      cssLoaded,
      current,

      beforeEnter,
      doEnterAnimation,
      doLeaveAnimation,
      textStrokeGenerator,
      shadowGenerator,
      isDisabled,
      getFontFamilyCSS,
      dayjs,
    };
  },
});
</script>

<style>
.position-absolute {
  position: absolute !important;
}

.disabled {
  opacity: 0.5;
  filter: grayscale(0.7);
}
</style>
