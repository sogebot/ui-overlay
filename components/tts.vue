<template>
  <div/>
</template>

<script lang="ts">
import {
  defineComponent, onMounted, ref, useMeta,
} from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';

declare global {
  interface Window {
    responsiveVoice: any;
  }
}

let _key = '';

export default defineComponent({
  head:  {}, // enable useMeta
  props: { opts: Object },
  setup (props) {
    const options = ref(props.opts ?? {
      voice:                          'UK English Female',
      volume:                         50,
      rate:                           1,
      pitch:                          1,
      triggerTTSByHighlightedMessage: false,
    });
    const enabled = ref(false);
    const responsiveAPIKey = ref(null as string | null);

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

    const isTTSPlaying = () => {
      return typeof window.responsiveVoice !== 'undefined' && window.responsiveVoice.isPlaying();
    };

    const speak = (data: { text: string; highlight: boolean }) => {
      if (data.highlight && !options.value.triggerTTSByHighlightedMessage) {
        console.debug('This TTS is not set for higlighted messages.');
        return;
      }
      if (!enabled.value) {
        console.error('ResponsiveVoice is not properly set, skipping');
        return;
      }
      if (isTTSPlaying()) {
        // wait and try later
        setTimeout(() => speak(data), 1000);
        return;
      }
      window.responsiveVoice.speak(data.text, options.value.voice, {
        rate: options.value.rate, pitch: options.value.pitch, volume: options.value.volume,
      });
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

    const checkResponsiveVoiceAPIKey = () => {
      getSocket('/integrations/responsivevoice', true).emit('get.value', 'key', (err: string | null, value: string) => {
        if (err) {
          console.error(err);
          return;
        }
        if (responsiveAPIKey.value !== value) {
          // unload if values doesn't match
          if (value.trim().length === 0) {
            console.debug('TTS disabled, responsiveVoice key is not set');
            enabled.value = false;
          }
        }
        responsiveAPIKey.value = value;
        setTimeout(() => checkResponsiveVoiceAPIKey(), 10000);
      });
    };

    onMounted(() => {
      console.log('====== TTS ======')
      checkResponsiveVoiceAPIKey();
      getSocket('/overlays/texttospeech', true).on('speak', (data: { text: string; highlight: boolean }) => {
        console.debug('Incoming speak', data);
        speak(data);
      });
    });

    return { options };
  },
});
</script>
