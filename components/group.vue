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

<script lang="ts">
import type { OverlayMappers } from '@entity/overlay';
import {
  defineComponent, onMounted, ref,
} from '@nuxtjs/composition-api';
import axios from 'axios';
import { print } from 'graphql';
import { defaultsDeep } from 'lodash';

import GET from '~/queries/overlays/get.gql';

type Props = {
  children: OverlayMappers[],
  opts: any,
};

export default defineComponent({
  props: { opts: [Object, Array], children: Array },
  setup (props: Props) {
    const url = new URL(location.href);
    const isDebug = !!url.searchParams.get('groupDebug');
    const items = ref([] as (OverlayMappers & {
      width: number; height: number; alignX: number; alignY: number;
    })[]);
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
        const result = await axios({
          url:    '/graphql',
          method: 'post',
          data:   { query: print(GET), variables: { id: originalChild.opts?.overlayId } },

        });
        if (result.status === 200) {
          const data = result.data.data.overlays;
          for (const item of Object.values<OverlayMappers[]>(data)) {
            if (item.length > 0) {
              const refChild = item[0];
              items.value = [...items.value, { ...child, ...refChild }];
              return;
            }
          }
        }
      }
    };

    return {
      options, isDebug, items,
    };
  },
});
</script>

<style>
.v-application ul,
.v-application ol {
  padding: 0;
}
</style>
