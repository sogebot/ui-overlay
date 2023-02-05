<template>
  <div>
    <div v-if="options.type === 'niconico'" ref="chat">
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
      :class="{
        inline: options.type === 'horizontal',
        showAtLeft: options.type === 'horizontal' && options.reverseOrder,
        showAtTop: options.type === 'vertical' && options.reverseOrder }"
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
      <span v-for="message of orderBy(messages, 'timestamp', options.reverseOrder ? 'desc' : 'asc')" :key="message.timestamp + message.id" style="display: inline-flex;">
        <div v-show="message.show" class="chat px-2 mb-0" :class="{ inline: options.type === 'horizontal' }">
          <div style="align-items: baseline; display: inline-flex; width: fit-content;">
            <div v-if="options.showBadges && (message.badges || []).length > 0" class="pr-1 d-flex">
              <span
                v-for="badge of (message.badges || [])"
                :key="message.timestamp + message.id + badge.url"
                style="position: relative;"
                :style="{
                  width: `${options.useCustomBadgeSize ? options.customBadgeSize : options.font.size * 1.3}px`,
                  height: `1px`,
                }"
              >
                <img
                  :width="options.useCustomBadgeSize ? options.customBadgeSize : options.font.size * 1.3"
                  :height="options.useCustomBadgeSize ? options.customBadgeSize : options.font.size * 1.3"
                  class="badge"
                  :src="badge.url"
                >
              </span>
            </div>
            <div
              v-else
              class="pr-1 d-flex"
            >
              <span
                style="position: relative;"
                :style="{
                  width: `1px`,
                  height: `1px`,
                }"
              >
                <div
                  :style="{
                    width: `1px`,
                    height: `${options.useCustomBadgeSize ? options.customBadgeSize : options.font.size * 1.3}px`,
                  }"
                  class="badge"
                />
              </span>
            </div>
            <span v-if="options.showTimestamp" class="pr-1">{{ new Date(message.timestamp).toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' }) }}</span> <strong :style="{ color: generateColorFromString(message.displayName) }">{{ message.displayName }}</strong>:
            <div class="pl-1" style="overflow-wrap: anywhere;" v-html="message.message" />
          </div>
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
import orderBy from 'lodash/orderBy';

const props = defineProps({ opts: Object });
const posY = ref({} as Record<string, number>);
const fontSize = ref({} as Record<string, number>);
const speed = ref({} as Record<string, number>);
const messages = ref([] as { id: string, timestamp: number, userName: string, displayName: string, message: string, show: boolean, badges: any }[]);

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
  console.log(options.value);

  // add fonts import
  const head = document.getElementsByTagName('head')[0];
  const style = document.createElement('style');
  style.type = 'text/css';

  console.debug('Loading font', options.value.font.family);
  const fontFamily = options.value.font.family.replace(/ /g, '+');
  const css = `
  @import url('https://fonts.googleapis.com/css?family=${fontFamily}');

  div.chat {
    line-height: ${options.value.useCustomLineHeight ? options.value.customLineHeight + 'px' : 'normal'};
  }

  .emote {
    height: ${options.value.useCustomEmoteSize ? options.value.customEmoteSize : options.value.font.size * 1.3}px;
  }

  .emote[title^=":"] {
    height: ${options.value.useCustomEmoteSize ? options.value.customEmoteSize : options.value.font.size * 1.3}px;
  }

  .simpleChatImage {
    min-width: ${options.value.useCustomEmoteSize ? options.value.customEmoteSize : options.value.font.size * 1.3}px;
    height: 1px;
  }
  `;
  style.appendChild(document.createTextNode(css));
  head.appendChild(style);

  getSocket('/overlays/chat', true).on('timeout', (userName) => {
    const messagesToDelete: string[] = [];
    for (const message of messages.value.filter(o => o.userName === userName)) {
      delete posY.value[message.id];
      delete fontSize.value[message.id];
      delete speed.value[message.id];
      message.show = false;
      messagesToDelete.push(message.id);
    }

    setTimeout(() => {
      messages.value = messages.value.filter(o => !messagesToDelete.includes(o.id));
    }, 1000);
  });

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
  width: fit-content;
}

div.inline {
  display: inline-flex !important;
  width: max-content !important;
  right: 0;
}

div.inline.showAtLeft {
  left: 0 !important;
  right: inherit !important;
}

div.showAtTop {
  top: 0 !important;
  bottom: inherit !important;
}

.simpleChatImage {
  display: inline-block;
  position: relative;
}

.simpleChatImage .emote {
  vertical-align: middle;
  object-fit: contain;
  overflow: visible;
}

.badge {
  object-fit: contain;
  overflow: visible;
  vertical-align: middle;
}
</style>
