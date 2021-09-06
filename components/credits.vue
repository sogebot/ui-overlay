<template>
  <div>
    <pre
      v-if="isDebug"
      class="debug"
    >
isVideoSupported: {{ isVideoSupported }}
settings: {{ settings }}
currentPage: {{ currentPage }}
clipsPages: {{ clipsPages }}
isLoaded: {{ isLoaded }}
isPlaying: {{ isPlaying }}
isEnded: {{ isEnded }}
current: {{ current }}
  </pre>
    <div
      id="page"
      class="page"
    >
      <template v-for="el of current">
        <video
          v-if="el.type === 'video'"
          id="video"
          :key="el.index"
          class="video"
          playsinline
        >
          <source
            :src="el.clip"
            type="video/mp4"
          >
        </video>
        <div
          v-else-if="el.type ==='with-icon'"
          :key="el.index"
          class="text4"
          style="text-align: left; padding-left:5vw; padding-top: 0;"
        >
          <v-icon color="white" x-large left>{{ icons[el.class] }}</v-icon>
          {{ el.text }}
        </div>
        <img
          v-else-if="el.type === 'image'"
          :key="el.index"
          :src="el.image"
          :class="el.class"
        >
        <div
          v-else
          :key="el.index"
          :class="el.class"
          v-html="el.text"
        />
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import {
  mdiDeviantart,
  mdiDiscord,
  mdiFacebook,
  mdiGithub,
  mdiGoogle,
  mdiInstagram,
  mdiLinkedin,
  mdiMicrosoftWindows,
  mdiMicrosoftXbox,
  mdiPinterest,
  mdiReddit,
  mdiSkype,
  mdiSnapchat,
  mdiSonyPlaystation,
  mdiSpotify,
  mdiSteam,
  mdiTelegram,
  mdiTwitter,
  mdiVk,
  mdiYoutube,
} from '@mdi/js';
import { defineComponent, useStore } from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import {
  computed, nextTick, onMounted, ref, watch,
} from '@vue/composition-api';
import gsap from 'gsap';
import { defaultsDeep, groupBy } from 'lodash';
import { isVideoSupported } from '~/functions/isVideoSupported'

export default defineComponent({
  props: { opts: Object },
  setup (props) {
    const options = ref(
      defaultsDeep(props.opts, {
        speed:       'medium',
        social: [],
        customTexts: [],
        clips:       {
          play:        true,
          period:      'custom',
          periodValue: 31,
          numOfClips:  3,
          volume:      20,
        },
        text: {
          lastMessage:      'Thanks for watching',
          lastSubMessage:   '~ see you on the next stream ~',
          streamBy:         'Stream by',
          follow:           'Followed by',
          host:             'Hosted by',
          raid:             'Raided by',
          cheer:            'Cheered by',
          sub:              'Subscribed by',
          resub:            'Resubscribed by',
          subgift:          'Subgifts by',
          subcommunitygift: 'Community subgifts by',
          tip:              'Tips by',
        },
        show: {
          follow:           true,
          host:             true,
          raid:             true,
          sub:              true,
          subgift:          true,
          subcommunitygift: true,
          resub:            true,
          cheer:            true,
          clips:            true,
          tip:              true,
        },
      }));

    const url = new URL(location.href);
    const isDebug = !!url.searchParams.get('debug');

    const store = useStore<any>();

    const pages = ref([] as any[]);
    const clipsPages = ref([] as any[]);
    const clips = ref([] as any[]);
    const currentPage = ref(0);
    const isLoaded = ref(false);
    const isPlaying = ref(false);
    const isEnded = ref(false);

    const speed = ref(50);

    onMounted(() => {
      getSocket('/overlays/credits', true).emit('load', async (err: string | null, opts: any) => {
        if (err) {
          console.error(err);
          return;
        }

        // set speed
        if (options.value.speed === 'very slow') {
          speed.value = 50;
        }
        if (options.value.speed === 'slow') {
          speed.value = 25;
        }
        if (options.value.speed === 'medium') {
          speed.value = 15;
        }
        if (options.value.speed === 'fast') {
          speed.value = 5;
        }
        if (options.value.speed === 'very fast') {
          speed.value = 2;
        }

        // set page 1 -> title, game, text
        pages.value.push([
          {
            text:  opts.game,
            class: 'game',
            index: Math.random(),
          },
          {
            text:  opts.title,
            class: 'title',
            index: Math.random(),
          },
          {
            text:  options.value.text.streamBy,
            class: 'header3',
            index: Math.random(),
          },
          {
            text:  opts.streamer,
            class: 'streamer',
            index: Math.random(),
          },
          {
            text:  '',
            class: 'separator',
            index: Math.random(),
          },
          {
            image: 'https://static-cdn.jtvnw.net/ttv-boxart/' + encodeURIComponent(opts.game) + '-600x840.jpg',
            type:  'image',
            class: 'image',
            index: Math.random(),
          },
        ]);

        // preload ttv-boxart
        await new Promise((resolve) => {
          fetch('https://static-cdn.jtvnw.net/ttv-boxart/' + encodeURIComponent(opts.game) + '-600x840.jpg')
            .then((response) => {
              if (!response.ok) {
                throw new Error('Network response was not ok');
              }
              return response.blob();
            })
            .then(() => {
              console.debug('ttv-boxart loaded');
              resolve(true);
            })
            .catch(() => {
              console.error(`ttv-boxart not loaded`);
            });
        });

        await new Promise((resolve) => {
          getSocket('/overlays/credits', true).emit('getClips', { show: options.value.show.clips, ...options.value.clips }, (data: []) => {
            clips.value = data;
            console.log('Clips loaded', data);
            resolve(true);
          });
        })

        let currentKey = '';
        let page: any = [];
        let withoutPadding = true;
        for (const [key, object] of Object.entries(groupBy(opts.events, 'event'))) {
          if (!options.value.show[key]) {
            continue;
          }
          if (key !== currentKey) {
            currentKey = key;
            page.push({
              text:  options.value.text[key],
              class: withoutPadding ? 'header1 withoutPadding' : 'header1',
              index: Math.random(),
            });
            withoutPadding = false;
          }

          const groupByUsername = Object.entries(groupBy(object, 'username'));
          for (const [username, o] of groupByUsername) {
            let html = username;
            if (key === 'cheer') {
              html = `<strong style="font-size:65%">${o.reduce((a, b) => a + Number(b.values.bits), 0)} bits</strong> <br> ${username}`;
            } else if (['raid', 'host'].includes(key)) {
              html = `<strong style="font-size:65%">${o.reduce((a, b) => a + Number(b.values.viewers), 0)} viewers</strong> <br> ${username}`;
            } else if (['resub'].includes(key)) {
              html = `<strong style="font-size:65%">${o[0].values.subCumulativeMonths} months</strong> <br> ${username}`;
            } else if (['tip'].includes(key)) {
              html = `<strong style="font-size:65%">${Intl.NumberFormat(store.state.configuration.lang, { style: 'currency', currency: o[0].values.currency }).format(Number(o.reduce((a, b) => a + Number(b.values.amount), 0)))}</strong> <br> ${username}`;
            }
            page.push({
              text:  html,
              class: 'text4 column',
              index: Math.random(),
            });
          }
          for (let i = 0; i < 3 - (groupByUsername.length % 3); i++) {
            page.push({
              text:  '',
              class: 'text4 column',
              index: Math.random(),
            });
          }
        }
        if (page.length > 0) {
          pages.value.push(page);
        }

        // clips
        if (isVideoSupported) {
          for (let i = 0, length = clips.value.length; i < length; i++) {
            clipsPages.value.push(pages.value.length);

            const clip = clips.value[i];
            pages.value.push([
              {
                text:  clip.game,
                class: 'clip_game',
                index: Math.random(),
              },
              {
                text:  clip.title,
                class: 'clip_title',
                index: Math.random(),
              },
              {
                text:  clip.creator_name,
                class: 'clip_createdBy',
                index: Math.random(),
              },
              {
                text:  i + 1,
                class: 'clip_index',
                index: Math.random(),
              },
              {
                clip:  clip.mp4,
                class: 'clip_video',
                type:  'video',
                index: Math.random(),
              },
            ]);
          }
        } else {
          console.error('We are sorry, but this browser doesn\'t support video mp4/h264. Clips won\'t be shown.');
        }

        // custom texts
        if (options.value.customTexts.length > 0) {
          page = [];
          for (const ct of options.value.customTexts) {
            let cl = 'header2';
            if (ct.type === 'header') {
              cl = 'header3';
            }
            if (ct.type === 'text') {
              cl = 'text3';
            }
            if (ct.type === 'smallText') {
              cl = 'text4';
            }
            if (ct.type === 'separator') {
              cl = 'separator';
              ct.left = '';
              ct.right = '';
              ct.middle = '';
            }

            page.push({
              text:  ct.left,
              class: cl + ' column',
              index: Math.random(),
            });
            page.push({
              text:  ct.middle,
              class: cl + ' column',
              index: Math.random(),
            });
            page.push({
              text:  ct.right,
              class: cl + ' column',
              index: Math.random(),
            });
          }
          if (page.length > 0) {
            pages.value.push(page);
          }
        }

        // last page is lastMessage and lastSubMessage
        const social: any = [];
        for (const s of options.value.social) {
          social.push({
            text:  s.text,
            type:  'with-icon',
            class: s.type,
            index: Math.random(),
          });
        }

        pages.value.push([
          {
            text:  options.value.text.lastMessage,
            class: 'header1',
            index: Math.random(),
          }, {
            text:  options.value.text.lastSubMessage,
            class: 'text2',
            index: Math.random(),
          },
          {
            text:  '',
            class: 'separator',
            index: Math.random(),
          },
          ...social,
        ]);

        isLoaded.value = true;
      });
    });

    const current = computed(() => {
      return pages.value[currentPage.value];
    });

    watch(isEnded, (val) => {
      if (val) {
        if (pages.value[currentPage.value + 1]) {
          (document.getElementById('page') as HTMLElement).style.top = window.innerHeight + 'px';
          isEnded.value = false;
          isPlaying.value = false;
          currentPage.value++;
        }
      }
    });

    watch(isLoaded, () => {
      setInterval(() => {
        if (!isPlaying.value) {
          if ((document.getElementById('page') as HTMLElement).clientHeight === 0) {
            return;
          }
          (document.getElementById('page') as HTMLElement).style.top = window.innerHeight + 'px';

          nextTick(() => { // force next tick
            isPlaying.value = true;
            // normal linear if non clips
            if (!clipsPages.value.includes(currentPage.value)) {
              // set endPos to 0 if last page (so we see last page)
              const endPos = pages.value[currentPage.value + 1] ? -((document.getElementById('page') as HTMLElement).clientHeight + 100) : 0;
              const duration = (window.innerHeight + (-endPos)) * speed.value;
              gsap.to((document.getElementById('page') as HTMLElement), {
                duration:   duration / 1000,
                top:        endPos,
                ease:       endPos === 0 ? 'sine.out' : 'none',
                onComplete: () => {
                  isEnded.value = true;
                },
              });
            } else {
            // clip page
              const duration1 = window.innerHeight * speed.value;
              const duration2 = ((document.getElementById('page') as HTMLElement).clientHeight + 100) * speed.value;
              gsap.to((document.getElementById('page') as HTMLElement), {
                duration:   duration1 / 1000,
                top:        0,
                ease:       'sine.out',
                onComplete: () => {
                // play clip
                  const video = (document.getElementById('video') as HTMLAudioElement);
                  video.volume = options.value.clips.volume / 100;

                  if (options.value.clips.play) {
                    video.play();
                    video.onended = () => {
                      gsap.to((document.getElementById('page') as HTMLElement), {
                        duration:   duration2 / 1000,
                        top:        -((document.getElementById('page') as HTMLElement).clientHeight + 100),
                        ease:       'sine.in',
                        onComplete: () => {
                          isEnded.value = true;
                        },
                      });
                    };
                  } else {
                    gsap.to((document.getElementById('page') as HTMLElement), {
                      duration:   duration2 / 1000,
                      top:        -((document.getElementById('page') as HTMLElement).clientHeight + 100),
                      ease:       'none',
                      onComplete: () => {
                        isEnded.value = true;
                      },
                    });
                  }
                },
              });
            }
          });
        }
      }, 1000);
    });

    return {
      isDebug,
      pages,
      clipsPages,
      currentPage,
      isLoaded,
      isPlaying,
      isEnded,
      current,
      isVideoSupported,

      icons: {
        mdiDeviantart,
        mdiDiscord,
        mdiFacebook,
        mdiGithub,
        mdiGoogle,
        mdiInstagram,
        mdiLinkedin,
        mdiPinterest,
        mdiSonyPlaystation,
        mdiReddit,
        mdiSkype,
        mdiSnapchat,
        mdiSpotify,
        mdiSteam,
        mdiTelegram,
        mdiTwitter,
        mdiVk,
        mdiMicrosoftWindows,
        mdiMicrosoftXbox,
        mdiYoutube,
      },

    };
  },
});
</script>

<style>
  @import url('https://fonts.googleapis.com/css?family=Cabin+Condensed');

  .debug {
    z-index: 9999;
    background-color: rgba(0, 0, 0, 0.5);
    position: absolute;
    color: white;
    padding: 1rem;
  }

  svg {
    filter: drop-shadow( 0 0 .2rem #000 );
  }

  div.page {
    font-family: 'Cabin Condensed', sans-serif;
    text-align: center;
    text-transform: uppercase;
    color: #fff;
    position: relative;
    text-shadow: 0 0 1rem #000;
    top: -9999px;
    margin: 5vh;
  }

  .streamer {
    font-size: 2vw
  }

  .game {
    font-size: 4vw
  }

  .title {
    font-size: 2.5vw
  }

  .column {
    display: inline-block;
    width: 33%;
  }

  .text4 {
    padding-top: 2vw;
    font-size: 2vw;
  }

  .text3 {
    padding-top: 2vw;
    font-size: 2.5vw;
  }

  .text2 {
    padding-top: 2vw;
    font-size: 3vw;
  }

  .text1 {
    padding-top: 2vw;
    font-size: 3.5vw;
  }

  .image {
    width: 30vw;
  }

  .header3 {
    padding-top: 2vw;
    font-size: 2.5vw;
    font-weight: bold;
  }

  .header2 {
    padding-top: 2vw;
    font-size: 3vw;
    font-weight: bold;
  }

  .withoutPadding {
    padding-top: 0 !important;
  }

  .separator {
    padding-top: 10vw;
  }

  .header1 {
    padding-top: 10vw;
    font-size: 3.5vw;
    font-weight: bold;
  }

  .clip_title, .clip_game, .clip_createdBy {
    text-align: left;
    font-size: 3vw;
  }
  .clip_createdBy {
    font-size: 2.5vw
  }
  .clip_game {
    font-weight: bold;
  }
  .clip_index {
    font-size: 10vw;
    position: absolute;
    right: 2.5vw;
    top: 0;
  }
  .video {
    width: 100%;
    padding-top: 8vh;
    max-height: 65vh;
  }
</style>
