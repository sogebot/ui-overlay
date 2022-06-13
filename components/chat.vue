<template>
  <div>
    <div ref="chat" v-if="options.type === 'niconico'">
      <template v-for="message of messages">
        <p
          :id="`nico-${message.id}`"
          :key="message.timestamp + message.id"
          class="nico"
          :style="{
            position: 'absolute',
            width: 'max-content',
            top: `${Math.max(1, (posY[message.id] || 0))}%`,
            'color': options.font.color,
            'font-family': options.font.family,
            'font-weight': options.font.weight,
            'font-size': (Math.max(16, options.font.size + (fontSize[message.id] || 0))) + 'px',
            'text-shadow': [textStrokeGenerator(options.font.borderPx, options.font.borderColor), shadowGenerator(options.font.shadow)].filter(Boolean).join(', ')
          }"
        >
          <span v-if="options.showTimestamp">{{ new Date(message.timestamp).toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' }) }}</span> <span v-html="message.message" />
        </p>
      </template>
    </div>
    <div
      v-else
      ref="chat"
      :key="messages[0] ? messages[0].timestamp : Date.now()"
      class="pa-4"
      :class="{ inline: options.type === 'horizontal' }"
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
      <span v-for="message of messages" :key="message.timestamp + message.id">
        <div v-show="message.show" class="chat px-2 mb-0" :class="{ inline: options.type === 'horizontal' }">
          <div style="align-items: center; display: inline-flex; width: fit-content;">
            <template v-if="options.showBadges">
              <img style="position: relative; top: 2px;" :src="badge.url" v-for="badge of (message.badges || [])" :key="message.timestamp + message.id + badge"/>
            </template>
            <span v-if="options.showTimestamp">{{ new Date(message.timestamp).toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' }) }}</span> <strong class="pl-1" :style="{ color: generateColorFromString(message.username) }">{{ message.username }}</strong>:
          </div>
          <span class="pl-1" v-html="message.message" />
        </div>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { OverlayMapperChat } from '@sogebot/backend/src/database/entity/overlay';
import { getSocket } from '@sogebot/ui-helpers/socket';
import { shadowGenerator, textStrokeGenerator } from '@sogebot/ui-helpers/text';
import gsap from 'gsap';

const props = defineProps({ opts: Object });
const posY = ref({} as Record<string, number>);
const fontSize = ref({} as Record<string, number>);
const speed = ref({} as Record<string, number>);
const messages = ref([] as { id: string, timestamp: number, username: string, message: string, show: boolean }[]);

const chat = ref(null as unknown as HTMLElement);
const options = ref(props.opts as OverlayMapperChat['opts']);

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
    posY.value[data.id] = Math.floor(Math.random() * 90);
    fontSize.value[data.id] = Math.floor(Math.random() * 30) - 15;
    nextTick(() => {
      const message = messages.value.find(o => o.id === data.id);
      if (message) {
        const element = document.getElementById(`nico-${data.id}`);
        message.show = true;
        if (element) {
          nextTick(() => {
            element.style.left = `${chat.value.offsetWidth + element.offsetWidth}px`;
            chat.value.scroll(0, Number.MAX_SAFE_INTEGER);
            const width = (document.getElementById(`nico-${data.id}`)?.offsetWidth ?? 0);
            gsap.to(`#nico-${data.id}`, {
              ease: 'none', left: -(width * 2), duration: Math.max(5, Math.floor(Math.random() * 15)),
            });
          });
        }
      }
    });
  });

  setInterval(() => {
    const messagesToDelete: string[] = [];
    for (const message of messages.value.filter(o => o.show === true && o.timestamp + options.value.hideMessageAfter < Date.now())) {
      message.show = false;
      delete posY.value[message.id];
      delete fontSize.value[message.id];
      delete speed.value[message.id];
      messagesToDelete.push(message.id);
    }

    setTimeout(() => {
      messages.value = messages.value.filter(o => !messagesToDelete.includes(o.id));
    }, 1000);
    nextTick(() => {
      chat.value.scroll(0, Number.MAX_SAFE_INTEGER);
    });
  }, 1000);
});

</script>

<style>
div.chat {
  overflow: visible !important;
  line-height: normal;
  width: fit-content;
}

div.inline {
  display: inline-flex !important;
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
