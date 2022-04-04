<template>
  <div>
    <pre
      v-if="isDebug"
      class="debug"
    >
isFinished: {{ isFinished }}
isPlaying: {{ isPlaying }}
current: {{ getCurrentAlertList }}
finishedCount: {{ finishedCount }}
finished: {{ (getCurrentAlertList || []).filter(o => o.finished) }}
      </pre>
    <div
      v-if="isPlaying && !isFinished"
      class="absolute"
    >
      <transition
        v-for="(alert, index) of getCurrentAlertList"
        :key="index"
        :css="false"
        @enter="doEnterAnimation"
        @leave="doLeaveAnimation"
      >
        <iframe
          v-if="alert.type === 'html' && alert.run"
          v-show="alert.run && !alert.finished && !alert.leaveAnimation"
          :data-index="index"
          :class="[ alert.class ? alert.class : '']"
          :src="alert.url"
        />

        <audio
          v-if="alert.type === 'audio'"
          id="audio"
          :src="alert.url"
        />

        <video
          v-show="alert.run && alert.isLoaded && !alert.finished && !alert.leaveAnimation"
          v-if="alert.type === 'video' || alert.type === 'clip'"
          id="video"
          preload="metadata"
          playsinline
          :data-index="index"
          :data-src="alert.url"
          :class="[ alert.class ? alert.class : '']"
          :style="{ width: alert['size'], top: alert['y-offset'] ? alert['y-offset'] + 'px' : 'inherit', left: alert['x-offset'] ? alert['x-offset'] + 'px' : 'inherit' }"
        >
          <source
            :src="`${alert.url}\#t=0.1`"
            type="video/mp4"
          >
        </video>

        <div
          v-show="alert.run && !alert.finished && !alert.leaveAnimation"
          v-if="alert.type === 'text'"
          class="text"
          :data-index="index"
          :class="[ alert.class ? alert.class : '']"
          :style="{ top: alert['y-offset'] ? alert['y-offset'] + 'px' : 'inherit', left: alert['x-offset'] ? alert['x-offset'] + 'px' : 'inherit', 'text-align': alert.align || 'left' }"
        >
          {{ alert.text }}
        </div>

        <img
          v-show="alert.run && !alert.finished && !alert.leaveAnimation"
          v-if="alert.type === 'image'"
          class="image"
          :data-index="index"
          :class="[ alert.class ? alert.class : '']"
          :style="{ top: alert['y-offset'] ? alert['y-offset'] + 'px' : 'inherit', left: alert['x-offset'] ? alert['x-offset'] + 'px' : 'inherit' }"
          :src="alert.url"
        >
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getSocket } from '@sogebot/ui-helpers/socket';
import gsap from 'gsap';
import { defaults } from 'lodash';

interface Props {
  opts: {
    galleryCache: boolean,
    galleryCacheLimitInMb: 50,
  }
}

const props = defineProps<Props>();
const options = ref(
  defaults(props.opts, {
    galleryCache:          false,
    galleryCacheLimitInMb: 50,
  }));

const url = new URL(location.href);
const isDebug = !!url.searchParams.get('debug');

const isPlaying = ref(false);
const alerts = ref([] as any[]);

onMounted(() => {
  console.log('====== MEDIA ======');
  if (options.value.galleryCache) {
    console.log(`Gallery cache enabled (${options.value.galleryCacheLimitInMb}Mb)`);
    getSocket('/overlays/media', true).emit('cache', options.value.galleryCacheLimitInMb, async (err, data) => {
      if (err) {
        return console.error(err);
      }
      for (const galleryItem of data) {
        await fetch(new Request('/gallery/' + galleryItem, { cache: 'default' }));
        console.log('/gallery/' + galleryItem + ' loaded.');
      }
    });
  } else {
    console.log('Gallery cache disabled.');
  }
  getSocket('/overlays/media', true).on('alert', (data: any) => {
    for (const d of data) {
      d.run = false;
      d.isLoaded = false;
      d.finished = false;
      d.leaveAnimation = false;
      d.receivedAt = Date.now();
    }
    alerts.value.push(data);
  });

  setInterval(() => {
    try {
      if (!isPlaying.value) {
        isPlaying.value = getCurrentAlertList.value !== null;
      } else {
        for (const a of getCurrentAlertList.value) {
          if (a.run) {
            continue;
          }

          a.delay = Number(a.delay);
          if (isNaN(a.delay)) {
            a.delay = 0;
          }
          if (a.receivedAt + a.delay < Date.now()) {
            a.run = true;
          } else {
            continue;
          }

          if (a.type === 'audio') {
            if (!a.url) {
              a.finished = true;
              continue;
            }
            const audio = [document.getElementById('audio')] as HTMLMediaElement[];
            if (audio.length > 0) {
              for (const el of audio) {
                if (el.src === a.url) {
                  if (a.volume) {
                    el.volume = Number(a.volume) / 100;
                  }
                  if (!el.error) {
                    el.onended = () => (a.finished = true);
                    console.log('playing');
                    el.play().catch((err) => {
                      if (err) {
                        console.error('Something went wrong with your audio file');
                        console.error(err.message);
                        if ((a.url.startsWith('https://') && window.location.protocol.startsWith('http:'))
                                || (a.url.startsWith('http://') && window.location.protocol.startsWith('https:'))) {
                          console.error('You are using mixed content https + http');
                        }
                        a.finished = true;
                      }
                    });
                    // el.play()
                  } else {
                    a.finished = true;
                    console.error('Something went wrong with your audio file');
                  }
                }
              }
            } else {
              a.run = false; // we need to repeat if audio was not loaded yet
            }
          }

          if (a.type === 'video' || a.type === 'clip') {
            if (!a.url) {
              a.finished = true;
              continue;
            }
            const video = [document.getElementById('video')] as HTMLMediaElement[];
            if (video.length > 0) {
              for (const el of video) {
                if (el.dataset.src === a.url) {
                  if (typeof a.size === 'undefined') {
                    a.size = '100%';
                  }
                  if (!el.error) {
                    el.onended = () => {
                      a.leaveAnimation = true; // trigger leave animation
                      setTimeout(() => (a.finished = true), Number(a.duration || 1000)); // trigger finished
                    };
                    setTimeout(() => {
                      // run even if oncanplaythrough wasn't triggered
                      if (!a.canBePlayed) {
                        if (!a.thumbnail) {
                          a.thumbnail = true;
                          el.volume = 0;
                          el.play().catch((err) => {
                            if (err) {
                              console.error('Something went wrong with your video file');
                              console.error(err.message);
                              if ((a.url.startsWith('https://') && window.location.protocol.startsWith('http:'))
                                      || (a.url.startsWith('http://') && window.location.protocol.startsWith('https:'))) {
                                console.error('You are using mixed content https + http');
                              }
                              a.finished = true;
                            }
                          });
                          setTimeout(() => {
                            el.pause();
                            setTimeout(() => {
                              if (a.volume) {
                                el.volume = Number(a.volume) / 100;
                              }
                              a.isLoaded = true;
                              el.play().catch((err) => {
                                if (err) {
                                  console.error('Something went wrong with your video file');
                                  console.error(err.message);
                                  if ((a.url.startsWith('https://') && window.location.protocol.startsWith('http:'))
                                          || (a.url.startsWith('http://') && window.location.protocol.startsWith('https:'))) {
                                    console.error('You are using mixed content https + http');
                                  }
                                  a.finished = true;
                                }
                              });
                            }, 1000);
                          }, 100);
                        }
                      }
                    }, 5000);
                    el.oncanplaythrough = () => {
                      a.canBePlayed = true;
                      if (!a.thumbnail) {
                        a.thumbnail = true;
                        el.volume = 0;
                        el.play()
                          .catch((err) => {
                            if (err) {
                              console.error('Something went wrong with your video file');
                              console.error(err.message);
                              if ((a.url.startsWith('https://') && window.location.protocol.startsWith('http:'))
                                        || (a.url.startsWith('http://') && window.location.protocol.startsWith('https:'))) {
                                console.error('You are using mixed content https + http');
                              }
                              a.finished = true;
                            }
                          }).then(() => {
                            setTimeout(() => {
                              el.pause();
                              setTimeout(() => {
                                if (a.volume) {
                                  el.volume = Number(a.volume) / 100;
                                }
                                a.isLoaded = true;
                                el.play();
                                console.log('Playing video ' + el.dataset.src);
                              }, 1000);
                            }, 150);
                          });
                      }
                    };
                  } else {
                    a.leaveAnimation = true; // trigger leave animation
                    a.finished = true;
                    console.error('Something went wrong with your video file');
                    console.error(el.error);
                  }
                }
              }
            } else {
              a.run = false; // we need to repeat if audio was not loaded yet
            }
          }

          if (!a.finished && !['audio', 'video', 'clip'].includes(a.type)) {
            setTimeout(() => (a.leaveAnimation = true), Number(a.duration || 1000) + Number(a.time || 1000)); // trigger leave animation
            setTimeout(() => (a.finished = true), Number(a.duration || 1000) + Number(a.duration || 1000) + Number(a.time || 1000)); // trigger finished
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, 100);
});

const getCurrentAlertList = computed(() => {
  return alerts.value.length > 0 ? alerts.value[0] : null;
});

const finishedCount = computed(() => {
  if (getCurrentAlertList.value) {
    return getCurrentAlertList.value.filter((o: any) => o.finished).length;
  } else {
    return 0;
  }
});

const isFinished = computed(() => {
  if (getCurrentAlertList.value) {
    return finishedCount.value === getCurrentAlertList.value.length;
  } else {
    return true;
  }
});

watch(isFinished, (val: boolean) => {
  if (val) {
    isPlaying.value = false;
    alerts.value.shift();
    if (alerts.value[0]) {
      for (const a of alerts.value[0]) {
        a.receivedAt = Date.now();
      }
    }
  }
});

const doEnterAnimation = (el: HTMLElement, done: () => void) => {
  gsap.to(el, {
    duration:   (getCurrentAlertList.value[el.dataset.index || 0].duration || 1000) / 1000,
    opacity:    1,
    onComplete: () => {
      done();
    },
  });
};

const doLeaveAnimation = (el: HTMLElement, done: () => void) => {
  gsap.to(el, {
    duration:   (getCurrentAlertList.value[el.dataset.index || 0].duration || 1000) / 1000,
    opacity:    0,
    onComplete: () => {
      done();
    },
  });
};
</script>

<style scoped>
  .debug {
    z-index: 9999;
    background-color: rgb(0 0 0 / 50%);
    position: absolute;
    color: white;
    padding: 1rem;
  }

  .absolute {
    position: absolute;
    width: 100%;
    height: 100%;
    display: table;
  }

  iframe,
  audio,
  video,
  .text,
  img {
    opacity: 0;
    position: relative;
  }

  video {
    background: transparent;
  }

  iframe,
  video {
    border: 0;
    width: 100%;
    height: 100%;
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 2s;
  }

  .fade-enter,
  .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
    opacity: 0;
  }
</style>
