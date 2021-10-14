<template>
  <div>
    <component
      :is="item.type"
      v-for="item of options.items"
      :key="item.id"
      :id="item.id"
      :opts="JSON.parse(item.opts)"
      :style="{
        border: isDebug ? '2px solid orange' : 'inherit',
        position: 'absolute',
        width: `${item.width}px`,
        height: `${item.height}px`,
        left: `${item.alignX}px`,
        top: `${item.alignY}px`,
        overflow: 'hidden',
      }"
    />
  </div>
</template>

<script lang="ts">
import {
  defineComponent, onMounted, ref,
} from '@nuxtjs/composition-api';
import { defaultsDeep } from 'lodash';

export default defineComponent({
  props: { opts: [Object, Array] },
  setup (props) {
    const url = new URL(location.href);
    const isDebug = !!url.searchParams.get('groupDebug');
    const options = ref(
      defaultsDeep(props.opts, {
        canvas: {
          width:  1920,
          height: 1080,
        },
        items: [],
      }));

    onMounted(() => {
      console.log('====== GROUP OF OVERLAYS ======');
    });

    return { options, isDebug };
  },
});
</script>

<style>
.v-application ul, .v-application ol {
  padding: 0;
}
</style>
