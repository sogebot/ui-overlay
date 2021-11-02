<template>
  <vue-word-cloud
    :words="Object.entries(wordMap)"
    :color="opts.wordFont.color"
    :font-family="opts.wordFont.family"
    :font-weight="String(opts.wordFont.weight)"
    :rotation="() => Math.random() >= 0.5 ? 0 : 3/4"
    :font-size-ratio="5"
  />
</template>

<script lang="ts">
import {
  defineComponent, onMounted, ref,
} from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import Vue from 'vue';
import VueWordCloud from 'vuewordcloud';

const time = {
  seconds: 1000,
  minutes: 60 * 1000,
  hours:   60 * 60 * 1000,
} as const;

export default defineComponent({
  components: { [VueWordCloud.name]: VueWordCloud },
  props:      { opts: Object },
  setup (props) {
    const wordMap = ref({} as Record<string, number>);
    onMounted(() => {
      console.log('====== WORDCLOUD ======');

      if (props.opts) {
        const head = document.getElementsByTagName('head')[0];
        const style = document.createElement('style');
        style.type = 'text/css';
        console.debug('Loading font', props.opts.wordFont.family);
        const font = props.opts.wordFont.family.replace(/ /g, '+');
        const css = '@import url(\'https://fonts.googleapis.com/css?family=' + font + '\');';
        style.appendChild(document.createTextNode(css));
        head.appendChild(style);
      }

      getSocket('/overlays/wordcloud', true).on('wordcloud:word', (words) => {
        for (const word of words) {
          Vue.set(wordMap.value, word, (wordMap.value[word] ?? 0) + 1);
          setTimeout(() => {
            Vue.set(wordMap.value, word, (wordMap.value[word] ?? 0) - 1);
            for (const key of Object.keys(wordMap.value)) {
              if (wordMap.value[key] <= 0) {
                delete wordMap.value[key];
              }
            }
          }, props.opts?.fadeOutInterval * (time as any)[props.opts?.fadeOutIntervalType]);
        }

        console.log({ words });
      });
    });
    return { wordMap };
  },
});
</script>
