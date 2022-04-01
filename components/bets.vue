<template>
  <div>
    <transition name="fade">
      <div
        v-if="currentBet"
        v-show="currentBet && !currentBet.isLocked"
        id="bet"
      >
        <strong class="title">{{ currentBet.title }}</strong>
        <strong class="timer">
          <span
            v-if="timeToEnd < 1"
            style="color: red;"
          >&lt;1min</span>
          <span v-else>{{ timeToEnd }}min</span>
        </strong>
        <div id="options">
          <div
            v-for="(option, index) in currentBet.options"
            :key="option"
          >
            <div class="title">
              {{ index + 1 }} ... {{ option }}
            </div>
            <div class="percentage">
              {{ getPercentage(index) }}%
            </div>
            <div
              class="bar"
              :style="{
                'background-color': getColor(index),
                'width': getPercentage(index) === 0 ? '5px' : getPercentage(index) + '%'
              }"
              style="height: 1.4em;"
            />
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import { BetsInterface } from '@entity/bets';
import {
  computed,
  defineComponent, onMounted, ref,
} from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';

export default defineComponent({
  setup () {
    const colors = ['blue', 'red', 'orange', 'green', 'purple', 'yellow', 'pink', 'cyan'];
    const currentBet = ref(null as Required<BetsInterface> | null);

    const timeToEnd = computed(() => {
      if (currentBet.value && !currentBet.value.isLocked) {
        return Math.floor(Math.floor((currentBet.value.endedAt - Date.now()) / 1000) / 60);
      } else {
        return 0;
      }
    });

    onMounted(() => {
      console.log('====== BETS ======');
      refresh();
    });

    const getPercentage = (index: number) => {
      if (currentBet.value && currentBet.value.participations.length > 0) {
        return currentBet.value.participations
          .filter(o => Number(o.optionIdx) === Number(index)).length / (currentBet.value.participations.length / 100);
      } else {
        return 0;
      }
    };

    const getColor = (index: number): string => {
      if (typeof colors[index] === 'undefined') {
        return getColor(index - colors.length);
      } else {
        return colors[index];
      }
    };

    const refresh = () => {
      getSocket('/overlays/bets', true).emit('data', (data) => {
        currentBet.value = data ?? null;
        console.log({ data });
        setTimeout(() => refresh(), 5000);
      });
    };

    return {
      timeToEnd,
      currentBet,
      getColor,
      getPercentage,
    };
  },
});
</script>

<style scoped>
  @import url("https://fonts.googleapis.com/css?family=Cabin");
  @import url("https://fonts.googleapis.com/css?family=Cabin+Condensed");

  #bet {
    font-family: Cabin, sans-serif;
    padding: 0.5em 1em;
    border: 3px solid rgb(40 40 40 / 50%);
    background-color: rgb(40 40 40 / 50%);
    color: white;
    text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
    text-transform: uppercase;
  }

  #bet > .title {
    font-weight: bold;
    font-size: 2em;
    color: orange;
  }

  #options > div > .title {
    font-size: 1.1em;
    font-weight: bold;
    z-index: 99999;
    padding-left: 0.5em;
    position: absolute;
  }

  #options > div > .bar {
    z-index: -1;
    margin-top: 0.2em;
    opacity: 0.5;
  }

  #options > div > .percentage {
    position: absolute;
    right: 2.5em;
    padding-top: 0.25em;
    z-index: 1;
    font-size: 0.8em;
    font-family: "Cabin Condensed", sans-serif;
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 2s;
  }

  .fade-enter,
  .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
    opacity: 0;
  }
</style>
