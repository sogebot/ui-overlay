<template>
  <div
    v-if="$store.state.isUILoaded"
    id="main"
    v-html="text"
  />
</template>

<script setup lang="ts">
import { getSocket } from '@sogebot/ui-helpers/socket';

const { $store } = useNuxtApp();
const props = defineProps({ opts: Object });

const nonParsedText = ref('');
const text = ref('');
const js = ref(null as any);
const css = ref(null as any);
const external = ref(false);

const onChange = () => {
  if (js.value) {
    console.group('onChange()');
    console.log(js.value);
    console.groupEnd();
    // eslint-disable-next-line no-eval
    eval(js.value + ';if (typeof onChange === "function") { onChange(); }');
  }
};

const refresh = () => {
  return new Promise((resolve) => {
    console.debug(`${Date().toLocaleString()} - refresh()`);
    if (props.opts?.id) {
      getSocket('/registries/text', true).emit('generic::getOne', { id: props.opts.id, parseText: true }, (err, cb) => {
        if (err) {
          return console.error(err);
        }
        if (!cb) {
          return console.warn('No text overlay found with id ' + props.opts?.id);
        }
        if (!external.value) {
          if (cb.external) {
            for (const link of cb.external) {
              const script = document.createElement('script');
              script.src = link;
              document.getElementsByTagName('head')[0].appendChild(script);
            }
          }
          external.value = true;
        }

        setTimeout(() => {
          const isChanged = text.value !== '' && text.value !== cb.parsedText;
          nonParsedText.value = cb.text;
          text.value = cb.parsedText;
          nextTick(() => {
            if (!js.value && cb.js) {
              js.value = cb.js;
            }
            if (!css.value && cb.css) {
              css.value = cb.css;
            }
            if (isChanged) {
              onChange();
            }
            resolve(true);
          });
        }, 100);
      });
    } else {
      console.error('Missing id param in url');
      resolve(true);
    }
  });
};

onMounted(async () => {
  console.log('====== TEXT REGISTRY ======');
  await refresh();
  setInterval(() => {
    refresh();
  }, 2000);
});

watch(css, (val: string) => {
  const head = document.getElementsByTagName('head')[0];
  const style = (document.createElement('style') as any);
  style.type = 'text/css';
  if (style.styleSheet) {
    // This is required for IE8 and below.
    style.styleSheet.cssText = val;
  } else {
    style.appendChild(document.createTextNode(val));
  }
  head.appendChild(style);
});

watch(js, async (val: string) => {
  await new Promise((resolve) => {
    (function check () {
      if ($store.state.isUILoaded) {
        resolve(true);
      } else {
        setTimeout(() => check(), 10);
      }
    })();
  });
  console.log();
  console.group('onLoad()');
  console.log(val);
  console.groupEnd();
  // eslint-disable-next-line no-eval
  eval(val + ';if (typeof onLoad === "function") { onLoad(); }');
});
</script>
