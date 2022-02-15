<template>
  <div style="height: 100%; display: flex;">
    <div v-if="isDebug">
      <json-viewer
        :value="{currentVote, votes, settings, shouldShow: settings.hideAfterInactivity && inactivityTime < settings.inactivityTime, inactivityTime }"
        boxed
        copyable
        :expand-depth="10"
      />
    </div>
    <transition name="fade">
      <div
        v-if="currentVote !== null"
        v-show="!settings.hideAfterInactivity || (settings.hideAfterInactivity && inactivityTime < settings.inactivityTime)"
        id="box"
        :class="[getTheme(settings.theme)]"
        style="display: inline-block; width: 100%;"
        :style="{ 'align-self': settings.align === 'top' ? 'flex-start' : 'flex-end' }"
      >
        <strong class="title">{{ currentVote.title }}</strong>
        <div v-if="currentVote.type === 'normal'" class="helper">
          {{ translate('systems.polls.overlay.type') }} <kbd>{{ voteCommand }} 1</kbd>, <kbd>{{ voteCommand }} 2</kbd>,
          {{ translate('systems.polls.overlay.inChatToVote') }}
        </div>
        <div v-else-if="currentVote.type === 'numbers'" class="helper">
          {{ translate('systems.polls.overlay.type') }} <kbd>1</kbd>, <kbd>2</kbd>,
          {{ translate('systems.polls.overlay.inChatToVote') }}
        </div>
        <div v-else-if="currentVote.type === 'tips'" class="helper">
          {{ translate('systems.polls.overlay.add') }} <kbd>#vote1</kbd>, <kbd>#vote2</kbd>, <span
            v-html="translate('systems.polls.overlay.toYourMessage').replace('$type', translate('systems.polls.overlay.tips'))"
          />
        </div>
        <div v-else class="helper">
          {{ translate('systems.polls.overlay.add') }} <kbd>#vote1</kbd>, <kbd>#vote2</kbd>, <span
            v-html="translate('systems.polls.overlay.toYourMessage').replace('$type', translate('systems.polls.overlay.bits'))"
          />
        </div>
        <div
          v-for="(option, index) in currentVote.options"
          :key="option"
          class="options"
          :class="[index === 0 ? 'first' : '', index === currentVote.options.length - 1 ? 'last': '']"
        >
          <div class="numbers">
            {{ index+1 }}
          </div>
          <div style="width:100%">
            <div>{{ option }}</div>
            <div class="background-bar" />
            <div
              class="bar"
              :style="{
                'width': getPercentage(index) === '0' ? '5px' : getPercentage(index) + '%'
              }"
            />
          </div>
          <div class="percentage">
            {{ getPercentage(index, 1) }}%
          </div>
        </div>
        <div id="footer">
          <div style="width: 100%">
            {{ translate('systems.polls.totalVotes') }}
            <strong v-if="currentVote.type !== 'tips'">{{ totalVotes }}</strong>
            <strong v-else>{{ Number(totalVotes).toFixed(1) }}</strong>
          </div>
          <div style="width: 100%">
            {{ translate('systems.polls.activeFor') }} <strong>{{ dayjs().from(dayjs(activeTime), true) }}</strong>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import { PollInterface } from '@entity/poll';
import {
  computed, defineComponent, onMounted, ref, watch,
} from '@nuxtjs/composition-api';
import { dayjs } from '@sogebot/ui-helpers/dayjsHelper';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import JsonViewer from 'vue-json-viewer';

export default defineComponent({
  components: { JsonViewer },
  props:      { opts: Object },
  setup (props) {
    const url = new URL(location.href);
    const isDebug = !!url.searchParams.get('debug');

    const currentVote = ref(null as any);
    const votes = ref([] as any[]);
    const cachedVotes = ref([] as any[]);
    const lastUpdatedAt = ref(0);
    const currentTime = ref(0);
    const voteCommand = ref('!vote');
    const settings = ref(props.opts ?? {
      theme:               'light',
      hideAfterInactivity: false,
      inactivityTime:      5000,
      pitch:               1,
      align:               'top',
    });

    onMounted(() => {
      console.log('====== POLLS ======');
      refresh();
      setInterval(() => (currentTime.value = Date.now()), 100);
      getSocket('/overlays/polls', true).emit('getVoteCommand', (cmd: string) => (voteCommand.value = cmd));
    });

    const inactivityTime = computed(() => {
      return currentTime.value - lastUpdatedAt.value;
    });

    const activeTime = computed(() => {
      return new Date(currentVote.value.openedAt).getTime();
    });

    const totalVotes = computed(() => {
      let _votes = 0;
      for (let i = 0, length = votes.value.length; i < length; i++) {
        _votes += votes.value[i].votes;
      }
      return _votes;
    });

    watch(votes, (val) => {
      if (currentVote.value && currentVote.value.options !== 'undefined') {
        for (const idx of Object.keys(currentVote.value.options)) {
          let count = 0;
          let cachedCount = 0;
          for (const v of val.filter(o => String(o.option) === idx)) {
            count += v.votes;
          }
          for (const v of cachedVotes.value.filter(o => String(o.option) === idx)) {
            cachedCount += v.votes;
          }
          if (cachedCount !== count) {
            lastUpdatedAt.value = Date.now();
          } // there is some change
        }
        cachedVotes.value = val; // update cached votes
      } else {
        cachedVotes.value = [];
      }
    });

    const getTheme = (theme: string) => {
      return theme.replace(/ /g, '_').toLowerCase().replace(/\W/g, '');
    };

    const getPercentage = (index: number, toFixed?: number) => {
      let _votes = 0;
      for (let i = 0, length = votes.value.length; i < length; i++) {
        if (votes.value[i].option === index) {
          _votes += votes.value[i].votes;
        }
      }
      return Number((100 / totalVotes.value) * _votes || 0).toFixed(toFixed || 0);
    };

    const refresh = () => {
      getSocket('/overlays/polls', true).emit('data', (cb: PollInterface, _votes: any[]) => {
        // force show if new vote
        if (currentVote.value === null) {
          lastUpdatedAt.value = Date.now();
        }
        votes.value = _votes;
        currentVote.value = cb;
        setTimeout(() => refresh(), 5000);
      });
    };

    return {
      currentVote,
      voteCommand,
      settings,
      votes,
      cachedVotes,
      lastUpdatedAt,
      currentTime,
      inactivityTime,
      activeTime,
      totalVotes,
      getTheme,
      getPercentage,
      refresh,
      dayjs,
      isDebug,
      translate,
    };
  },
});
</script>

<style>
  #overlays {
    height: 100%;
  }
</style>

<style scoped>
  @import url('https://fonts.googleapis.com/css?family=Barlow');
  @import url('https://fonts.googleapis.com/css?family=Barlow+Condensed');

  .hide {
    display: none;
  }

  #box {
    font-family: 'Barlow', sans-serif;
    padding: 0.5rem 1rem;
    margin: 1.5rem;

  }

  .title {
    font-size: 1.2rem;
  }

  .helper {
    text-align: center;
    padding-top: 0.5rem;
  }

  .options, #footer {
    width: 100%;
    display: flex;
    padding: 0.5rem 0;
  }

  .options.first {
    padding-top: 1rem;
  }

  .options.last {
    padding-bottom: 1rem;
  }

  #footer {
    text-align: center;
  }

  .numbers {
    padding: 0 1rem 0 0;
    width: 1%;
  }

  .percentage {
    padding: 0;
    width: 80;
    text-align: right;
  }

  .background-bar, .bar {
    position: relative;
    top: 0.5rem;
    height: 0.5rem;
    width: 100%;
  }

  .bar {
    position: relative;
    top: 0;
    background-color: rgb(207, 207, 207);
  }

  .fade-enter-active, .fade-leave-active {
    transition: opacity 1s;
  }
  .fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
    opacity: 0;
  }

  /* LIGHT THEME */
  #box.light {
    background-color: #f0f1f4;
    color: rgb(32, 32, 32);
    box-shadow: 0 0 2rem black;
  }

  #box.light .background-bar {
    background-color: rgb(207, 207, 207);
  }

  #box.light .bar {
    background-color: rgb(138, 138, 138);
  }

  /* DARK THEME */
  #box.dark {
    background-color: rgb(32, 32, 32);
    color: #f0f1f4;
    box-shadow: 0 0 2rem black;
  }

  #box.dark .background-bar {
    background-color: rgb(138, 138, 138);
  }

  #box.dark .bar {
    background-color: rgb(207, 207, 207);
  }

  /* SOGE'S GREEN THEME */
  #box.soges_green {
    background-color: rgba(0, 0, 0, 0.8);
    color: #f0f1f4;
    border-top: 5px solid #acd301;
    border-bottom: 5px solid #acd301;
  }

  #box.soges_green .bar {
    background-color: #acd301
  }

  #box.soges_green .numbers {
    color: #acd301;
    font-size: 2rem;
    font-weight: bold;
    padding-right: 2rem;
  }

  #box.soges_green #footer strong {
    color: #acd301;
  }
</style>
