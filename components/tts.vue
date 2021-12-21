<template>
  <div />
</template>

<script lang="ts">
import {
  defineComponent, onMounted, ref, useMeta,
} from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import { defaults } from 'lodash';

declare global {
  interface Window {
    responsiveVoice: any;
  }
}

let _key = '';

export default defineComponent({ // enable useMeta
  props: { opts: Object },
  setup (props) {
    const options = ref(
      defaults(props.opts, {
        voice:                          'UK English Female',
        volume:                         50,
        rate:                           1,
        pitch:                          1,
        triggerTTSByHighlightedMessage: false,
      }));
    const enabled = ref(false);
    const responsiveAPIKey = ref(null as string | null);
    const isSpeaking = ref(false);

    useMeta(() => {
      if (responsiveAPIKey.value && _key !== responsiveAPIKey.value) {
        _key = responsiveAPIKey.value;
        setTimeout(() => {
          initResponsiveVoice();
        }, 1000);
        return {
          script: [
            {
              hid: 'responsivevoice',
              src: 'https://code.responsivevoice.org/responsivevoice.js?key=' + responsiveAPIKey.value,
            },
          ],
        };
      } else {
        return {};
      }
    });

    const isTTSPlaying = {
      0: () => typeof window.responsiveVoice !== 'undefined' && window.responsiveVoice.isPlaying(),
      1: () => isSpeaking.value,
    };

    const speak = (data: { text: string; highlight: boolean, key: string, service: 0 | 1 }) => {
      if (data.highlight && !options.value.triggerTTSByHighlightedMessage) {
        console.debug('This TTS is not set for higlighted messages.');
        return;
      }
      if (!enabled.value) {
        console.error('TTS is not properly set, skipping');
        return;
      }
      if (isTTSPlaying[data.service]()) {
        // wait and try later
        setTimeout(() => speak(data), 1000);
        return;
      }

      if (data.service === 0) {
        // RESPONSIVE VOICE
        window.responsiveVoice.speak(data.text, options.value.voice, {
          rate: options.value.rate, pitch: options.value.pitch, volume: options.value.volume,
        });
      } else {
        // GOOGLE
        isSpeaking.value = true;
        getSocket('/core/tts', true).emit('speak', {
          ...options.value, key: data.key, text: data.text,
        }, (err: Error | null, b64mp3: string) => {
          if (err) {
            isSpeaking.value = false;
            return console.error(err);
          }
          const snd = new Audio(`data:audio/mp3;base64,` + b64mp3);
          snd.play();
          snd.onended = () => (isSpeaking.value = false);
        });
      }
    };

    const initResponsiveVoice = () => {
      if (typeof window.responsiveVoice === 'undefined') {
        setTimeout(() => initResponsiveVoice(), 200);
        return;
      }
      window.responsiveVoice.init();
      console.debug('= ResponsiveVoice init OK');
      enabled.value = true;
    };

    onMounted(() => {
      console.log('====== TTS ======');
      getSocket('/overlays/texttospeech', true).on('speak', (data: { text: string; highlight: boolean, service: 0 | 1, key: string }) => {
        console.debug('Incoming speak', data);
        if (data.service === 0) {
          responsiveAPIKey.value = data.key;
        } else {
          responsiveAPIKey.value = null;
          enabled.value = true;
        }
        speak(data);
      });
    });

    return { options };
  },
  head: {},
});
</script>
