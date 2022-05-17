<template>
<div>
  <div
    ref="chat"
    :key="messages[0] ? messages[0].timestamp : Date.now()"
    class="pa-4"
    :class="{ inline: options.isHorizontal }"
    :style="{
      position: 'absolute',
      bottom: 0,
      overflow: 'visible',
      width: '100%',
      'color': options.font.color,
      'font-family': options.font.family,
      'font-weight': options.font.weight,
      'font-size': options.font.size + 'px',
      'text-shadow': [textStrokeGenerator(options.font.borderPx, options.font.borderColor), shadowGenerator(options.font.shadow)].filter(Boolean).join(', ')
    }"
  >
    <template v-for="message of messages">
      <v-slide-x-reverse-transition :key="'transition' + message.id">
        <p v-show="message.show" :key="message.timestamp" class="chat px-2 mb-0" :class="{ inline: options.isHorizontal }">
          <span v-if="options.showTimestamp">{{ new Date(message.timestamp).toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' }) }}</span> <strong class="pl-1" :style="{ color: generateColorFromString(message.username) }">{{ message.username }}</strong>: <span class="pl-1" v-html="message.message" />
        </p>
      </v-slide-x-reverse-transition>
    </template>
  </div>
</div>
</template>

<script setup lang="ts">
import { getSocket } from '@sogebot/ui-helpers/socket';
import defaultsDeep from 'lodash/defaultsDeep';
import { shadowGenerator, textStrokeGenerator } from '@sogebot/ui-helpers/text';

const props = defineProps({ opts: Object });
const messages = ref([] as { id: string, timestamp: number, username: string, message: string, show: boolean }[]);

const chat = ref(null as unknown as HTMLElement);
const options = ref(
  defaultsDeep(props.opts, {
    isHorizontal:     false,
    showTimestamp:    true,
    hideMessageAfter: 600000,
    font:             {
      family:      'PT Sans',
      size:        20,
      borderPx:    1,
      borderColor: '#000000',
      weight:      '500',
      color:       '#ffffff',
      shadow:      [],
    },
  }));

const generateColorFromString = (stringInput: string) => {
  const stringUniqueHash = [...stringInput].reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  return `hsl(${stringUniqueHash % 360}, 80%, 60%)`;
};

onMounted(() => {
  console.log(`====== CHAT ======`);

  // add fonts import
  const head = document.getElementsByTagName('head')[0];
  const style = document.createElement('style');
  style.type = 'text/css';

  console.debug('Loading font', options.value.font.family);
  const fontFamily = options.value.font.family.replace(/ /g, '+');
  const css = `
  @import url('https://fonts.googleapis.com/css?family=${fontFamily}');

  .emote {
    height: ${options.value.font.size + 10}px;
  }

  .emote[title^=":"] {
    height: ${options.value.font.size}px;
  }

  .simpleChatImage {
    min-width: ${options.value.font.size + 10}px;
    min-height: ${(options.value.font.size + 10) / 2}px;
  }
  `;
  style.appendChild(document.createTextNode(css));
  head.appendChild(style);

  getSocket('/overlays/chat', true).on('message', (data) => {
    messages.value.push(data);
    nextTick(() => {
      const message = messages.value.find(o => o.id === data.id);
      if (message) {
        message.show = true;
        nextTick(() => {
          chat.value.scroll(0, Number.MAX_SAFE_INTEGER);
        });
      }
    });
  });

  setInterval(() => {
    const messagesToDelete: string[] = [];
    for (const message of messages.value.filter(o => o.show === true && o.timestamp + options.value.hideMessageAfter < Date.now())) {
      message.show = false;
      messagesToDelete.push(message.id);
    }

    setTimeout(() => {
      messages.value = messages.value.filter(o => ~messagesToDelete.includes(o.id));
    }, 1000)
    nextTick(() => {
      chat.value.scroll(0, Number.MAX_SAFE_INTEGER);
    });
  }, 1000);
});

</script>

<style>
p.chat {
  overflow: visible !important;
  line-height: normal;
}

p.inline {
  display: inline-block;
}

div.inline {
  width: max-content !important;
  right: 0;
}

.simpleChatImage {
  min-width: 32px;
  min-height: 17px;
  display: inline-block;
  position: relative;
}

.simpleChatImage .emote {
  position: absolute;
  margin-top: 50%;
  transform: translateY(-68%);
}
</style>
