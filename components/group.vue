<template>
  <div>
    <component
      :is="item.type"
      v-for="item of options"
      :key="item.id"
      :opts="item.opts"
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

export default defineComponent({
  props: { opts: [Object, Array] },
  setup (props) {
    const url = new URL(location.href);
    const isDebug = !!url.searchParams.get('groupDebug');
    const options = ref(Array.isArray(props.opts) ? props.opts : []);

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
