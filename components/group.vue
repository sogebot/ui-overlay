<template>
  <div>
    <template v-for="(item, idx) of overlay.items">
      <component
        :is="item.opts.typeId"
        :id="item.id"
        :key="item.id + '-' + idx"
        :if="item.opts.typeId !== 'reference'"
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
    </template>
  </div>
</template>

<script setup lang="ts">
import { Overlay, Reference } from '@entity/overlay';
import { getSocket } from '@sogebot/ui-helpers/socket';

type Props = {
  overlay: Overlay,
};

const props = defineProps<Props>();
const url = new URL(location.href);
const isDebug = !!url.searchParams.get('groupDebug');
const overlay = ref(props.overlay);

onMounted(async () => {
  console.log(overlay.value);
  for (const item of overlay.value.items) {
    if (item.opts.typeId === 'reference') {
      item.opts = await new Promise<any>((resolve) => {
        getSocket('/registries/overlays', true).emit('generic::getOne', (item.opts as Reference).overlayId ?? '', (err, result) => {
          if (err) {
            return console.error(err);
          }
          const foundItem = result?.items.find(o => o.id === (item.opts as Reference).overlayId);
          resolve(foundItem?.opts as any);
        });
      });
    }
  }
});
</script>

<style>
.v-application ul,
.v-application ol {
  padding: 0;
}
</style>
