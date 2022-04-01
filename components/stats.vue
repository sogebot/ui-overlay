<template>
  <div>
    <span id="stats">
      <span class="item viewers">
        <v-icon color="#fff" class="icon">{{ mdiEye }}</v-icon>
        <span>{{ stats.uptime === '00:00:00' ? '0' : stats.viewers }}</span>
        <span class="text" />
      </span>

      <span class="item uptime">
        <v-icon color="#fff" class="icon">{{ mdiClockTimeFive }}</v-icon>
        <span>{{ stats.uptime }}</span>
        <span class="text" />
      </span>

      <span class="item followers">
        <v-icon color="#fff" class="icon">{{ mdiAccountGroup }}</v-icon>
        <span>{{ stats.uptime === '00:00:00' ? '0' : stats.followers }}</span>
        <span class="text" />
      </span>

      <span class="item subscribers">
        <v-icon color="#fff" class="icon">{{ mdiStar }}</v-icon>
        <span>{{ stats.uptime === '00:00:00' ? '0' : stats.subscribers }}</span>
        <span class="text" />
      </span>

      <span class="item bits">
        <v-icon color="#fff" class="icon">{{ mdiDiamond }}</v-icon>
        <span>{{ stats.uptime === '00:00:00' ? '0' : stats.bits }}</span>
        <span class="text" />
      </span>
    </span>
  </div>
</template>

<script lang="ts">
import {
  mdiAccountGroup, mdiClockTimeFive, mdiDiamond, mdiEye, mdiStar,
} from '@mdi/js';
import {
  defineComponent, onMounted, ref,
} from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';

export default defineComponent({
  setup () {
    const stats: any = ref({});
    const interval: any[] = [];

    onMounted(() => {
      console.log('====== STATS ======');
      refresh();
      interval.push(setInterval(() => refresh(), 1000));
    });

    const refresh = () => {
      getSocket('/overlays/stats', true).emit('get', (cb: any) => {
        stats.value = cb;
      });
    };

    return {
      stats,
      mdiEye,
      mdiClockTimeFive,
      mdiAccountGroup,
      mdiStar,
      mdiDiamond,
    };
  },
});
</script>

<style>
  #stats {
    background-color: rgb(50 50 50 / 40%);
    padding: 3px;
    width: auto;
    text-shadow: 0 0 2px #000, 0 0 4px #888, 0 0 8px #888;
    color: white;
    font-size: 20px;
  }

  span.item {
    padding-left: 5px;
  }

  i {
    margin-left: 10px;
  }

  .icon {
    transform: translateY(-3px);
  }
</style>
