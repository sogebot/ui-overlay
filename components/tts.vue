<template>
  <div>
    <Head>
      <script v-if="responsiveAPIKey" :src="'https://code.responsivevoice.org/responsivevoice.js?key=' + responsiveAPIKey" hid="responsivevoice"></script>
    </Head>
  </div>
</template>

<script setup lang="ts">
import { getSocket } from '@sogebot/ui-helpers/socket';
import { defaults } from 'lodash';

const props = defineProps({ opts: Object });
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

const isTTSPlaying = {
  0: () => typeof (window as any).responsiveVoice !== 'undefined' && (window as any).responsiveVoice.isPlaying(),
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
    (window as any).responsiveVoice.speak(data.text, options.value.voice, {
      rate: options.value.rate, pitch: options.value.pitch, volume: options.value.volume,
    });
  } else {
    // GOOGLE
    isSpeaking.value = true;
    getSocket('/core/tts', true).emit('speak', {
      ...options.value, key: data.key, text: data.text,
    }, (err, b64mp3) => {
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

const isResponsiveVoiceEnabled = () => {
  return new Promise<void>((resolve) => {
    const check = () => {
      if (typeof (window as any).responsiveVoice === 'undefined') {
        setTimeout(() => check(), 200);
      } else {
        console.debug('= ResponsiveVoice init OK');
        (window as any).responsiveVoice.init();
        enabled.value = true;
        resolve();
      }
    };
    check();
  });
};

onMounted(() => {
  console.log('====== TTS ======');
  getSocket('/overlays/texttospeech', true).on('speak', async (data) => {
    console.debug('Incoming speak', data);
    if (data.service === 0) {
      responsiveAPIKey.value = data.key;
      await isResponsiveVoiceEnabled();
    } else {
      responsiveAPIKey.value = null;
      enabled.value = true;
    }
    speak(data);
  });
});
</script>
