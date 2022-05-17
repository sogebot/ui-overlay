<template>
  <div>
    <component
      :is="item.value"
      v-for="(item, idx) of items"
      :id="item.id"
      :key="item.id + '-' + idx"
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

<script setup lang="ts">
import type { OverlayMappers } from '@entity/overlay';
import { getSocket } from '@sogebot/ui-helpers/socket';

type Props = {
  children: OverlayMappers[],
  opts: Record<string, any>,
};

const props = defineProps<Props>();
const url = new URL(location.href);
const isDebug = !!url.searchParams.get('groupDebug');
const items = ref([] as (OverlayMappers & {
  width: number; height: number; alignX: number; alignY: number;
})[]);
const options = ref(props.opts as any);

onMounted(() => {
  console.log('====== GROUP OF OVERLAYS ======');
  for (const child of options.value.items) {
    getChildItem(child);
  }
});

const getChildItem = async (child: any) => {
  const originalChild = props.children?.find((o: any) => o.id === child.id);
  if (originalChild) {
    if (originalChild.value !== 'reference') {
      items.value = [...items.value, { ...child, ...originalChild }];
      return;
    }

    // we have reference and need to find original
    await new Promise((resolve) => {
      getSocket('/registries/overlays', true).emit('generic::getOne', originalChild.opts?.overlayId ?? '', (err, result) => {
        if (err) {
          return resolve(null);
        }
        items.value = [...items.value, { ...child, ...result }];
        resolve(true);
      });
    });
  }
};
</script>

<style>
.v-application ul,
.v-application ol {
  padding: 0;
}
</style>
