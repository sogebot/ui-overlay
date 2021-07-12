<template>
  <ul>
    <li
      v-for="event of events"
      :key="event._id"
      class="event"
      :class="[event.type]"
    >
      <template v-for="type of display">
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
</template>

<script lang="ts">
import {
  defineComponent, onMounted, ref, useStore,
} from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { orderBy } from 'lodash';

import { EventListInterface } from '~/.bot/src/bot/database/entity/eventList';

export default defineComponent({
  setup () {
    const events = ref([] as any[]);
    const display = ref(['username', 'event']);
    const url = new URL(location.href);
    const store = useStore<any>();

    onMounted(() => {
      console.log('====== EVENTLIST ======');
      setTimeout(() => refresh(), 1000);
    });

    const refresh = () => {
      getSocket('/overlays/eventlist', true).emit('getEvents', {
        ignore: url.searchParams.get('ignore') || '',
        limit:  Number(url.searchParams.get('count') || 5),
      }, (err: string | null, data: EventListInterface[]) => {
        if (err) {
          return console.error(err);
        }
        const order = (url.searchParams.get('order') as 'desc' | 'asc') || 'desc';
        display.value = url.searchParams.get('display')?.split(',') || 'username,event'.split(',');

        console.debug({ order, display: display.value });
        events.value = orderBy(data, 'timestamp', order).map((o) => {
          const values = JSON.parse(o.values_json);
          if (o.event === 'resub') {
            return { ...o, summary: values.subCumulativeMonths + 'x ' + translate('overlays-eventlist-resub') };
          } else if (o.event === 'cheer') {
            return { ...o, summary: values.bits + ' ' + translate('overlays-eventlist-cheer') };
          } else if (o.event === 'tip') {
            return { ...o, summary: Intl.NumberFormat(store.state.configuration.lang, { style: 'currency', currency: values.currency }).format(values.amount) };
          } else {
            return { ...o, summary: translate('overlays-eventlist-' + o.event) };
          }
        });
        setTimeout(() => refresh(), 5000);
      });
    };

    return {
      events, display, translate,
    };
  },
});
</script>

<style>
  @import url('https://fonts.googleapis.com/css?family=BenchNine');

  html, body {
    padding: 2px;
    padding-top: 10px;
    margin: auto;
    font-family: 'BenchNine', sans-serif;
    color: white;
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
