<template>
  <div class="eventlist-main">
    <ul>
      <li
        v-for="event of events"
        :key="event._id"
        class="event"
        :class="[event.type]"
      >
        <template v-for="type of options.display">
          <strong
            v-if="type === 'username'"
            :key="type"
            class="username"
          >{{ event.username }}</strong>
          <span
            v-else
            :key="type"
            class="event"
          >{{ event.summary }}</span>
        </template>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import {
  defineComponent, onMounted, ref, useStore,
} from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { defaults, orderBy } from 'lodash';

import { EventListInterface } from '@entity/eventList';

export default defineComponent({
  props: { opts: Object },
  setup (props) {
    const events = ref([] as any[]);
    const store = useStore<any>();
    const options = ref(
      defaults(props.opts, {
        display: ['username', 'event'],
        ignore:  [],
        count:   5,
        order:   'desc' as 'asc' | 'desc',
      }));

    onMounted(() => {
      console.log('====== EVENTLIST ======');
      setTimeout(() => refresh(), 1000);
    });

    const refresh = () => {
      getSocket('/overlays/eventlist', true).emit('getEvents', {
        ignore: options.value.ignore,
        limit:  options.value.count,
      }, (err: string | null, data: EventListInterface[]) => {
        if (err) {
          return console.error(err);
        }

        events.value = orderBy(data, 'timestamp', options.value.order).map((o) => {
          const values = JSON.parse(o.values_json);
          if (o.event === 'resub') {
            return { ...o, summary: values.subCumulativeMonths + 'x ' + translate('overlays-eventlist-resub') };
          } else if (o.event === 'cheer') {
            return { ...o, summary: values.bits + ' ' + translate('overlays-eventlist-cheer') };
          } else if (o.event === 'tip') {
            return { ...o, summary: Intl.NumberFormat(store.state.configuration.lang, { style: 'currency', currency: values.currency }).format(values.amount) };
          } else if (o.event === 'rewardredeem') {
            return { ...o, summary: values.titleOfReward };
          } else {
            return { ...o, summary: translate('overlays-eventlist-' + o.event) };
          }
        });
        setTimeout(() => refresh(), 5000);
      });
    };

    return {
      events, translate, options,
    };
  },
});
</script>

<style>
  @import url('https://fonts.googleapis.com/css?family=BenchNine');
  .eventlist-main {
    padding: 2px !important;
    padding-top: 10px !important;
    font-family: 'BenchNine', sans-serif !important;
    color: white !important;
  }

  ul {
    list-style-type: none;
    text-transform: uppercase;
    font-size: 1.6em;
    margin: 0;
    padding: 0;
    text-align: right;
  }

  ul li {
    width: 99%;
    margin-left: 0;
    text-shadow: 0 0 10px black, 0 0 20px black, 0 0 30px black;
  }

  ul li span {
    font-size: 0.6em;
  }

  ul li:nth-child(1) {
    opacity: 1;
    font-weight: bold;
  }

  ul li:nth-child(2) {
    opacity: 0.8;
  }

  ul li:nth-child(3) {
    opacity: 0.6;
  }

  ul li:nth-child(4) {
    opacity: 0.4;
  }

  ul li:nth-child(5) {
    opacity: 0.2;
  }

  .event {
    padding: 0 .2rem;
  }

  .username {
    padding: 0 .2rem;
  }
</style>
