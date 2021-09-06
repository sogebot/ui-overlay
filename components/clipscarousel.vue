<template>
  <div>
    <pre v-if="isDebug" class="debug" style="overflow: scroll; resize: both;">
<button @click="stopAnimation = !stopAnimation">Toggle Animation</button>
opts: {{ opts }}
stopAnimation: {{ stopAnimation }}
clipsSet: {{ clipsSet.map(o => o.id) }},
clips: {{ clips.map(o => o.id) }},
currentClip: {{ currentClip }},
offset: {{ offset }},
nextOffset: {{ nextOffset }}
moveToNextClipInProgress: {{ moveToNextClipInProgress }}
isReady: {{ isReady }}
  </pre>
    <div id="carousel" :style="{
        width: '99999999999%',
        position: 'absolute',
        opacity: isReady ? '1' : '0',
        transition: 'opacity 1s'
      }">
      <template v-for="(clip, index) of clipsSet">
        <video :key="clip.id" class="clips" preload="auto" playsinline
          :style="{ opacity: index === 1 ? '1' : '0.5', filter: 'grayscale(' + (index === 1 ? '0' : '1') + ')'}">
          <source :src="clip.mp4" type="video/mp4">
        </video>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent, nextTick, onMounted, ref, watch,
} from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import gsap from 'gsap';
import { cloneDeep } from 'lodash';

export default defineComponent({
  props: { opts: Object },
  setup (props) {
    const url = new URL(location.href);
    const isDebug = !!url.searchParams.get('debug');

    const clips = ref([] as any[]);
    const clipsSet = ref([] as any[]);
    const currentClip = ref(14);
    const offset = ref(0);
    const nextOffset = ref(0);
    const stopAnimation = ref(false);
    const isReady = ref(false);
    const moveToNextClipInProgress = ref(false);

    const setOffset = () => {
      try {
        const _clips = Array.from(document.getElementsByClassName('clips')) as HTMLVideoElement[];
        nextOffset.value = -(_clips[2].offsetLeft - (window.innerWidth / 3.4));
        offset.value = -(_clips[1].offsetLeft - (window.innerWidth / 3.4));
      } catch (e) {}
    };

    onMounted(() => {
      console.log('====== CLIPS CAROUSEL ======');
      getSocket('/overlays/clipscarousel', true).emit('clips', { customPeriod: props.opts?.customPeriod ?? 31, numOfClips: props.opts?.numOfClips ?? 20 }, (err: string | null, data: { clips: any, settings: any }) => {
        if (err) {
          console.error(err);
          return;
        }
        data.clips = data.clips
          .map((a: any) => ({ sort: Math.random(), value: a }))
          .sort((a: any, b: any) => a.sort - b.sort)
          .map((a: any) => a.value);

        console.log(data.clips, props.opts);

        if (data.clips.length < 2) {
          return console.error('At least 2 clips are needed');
        }

        data.clips = fillToFourClips(data.clips);
        clips.value = data.clips;
        getClipsSet();
        nextTick(() => {
          // center to second clip
          setOffset();
          moveToNextClip();

          setInterval(() => {
            if (moveToNextClipInProgress.value) {
              return;
            }

            getClipsSet();
            setOffset();

            const _clips = Array.from(document.getElementsByClassName('clips')) as HTMLVideoElement[];
            if (_clips[1].ended) {
              moveToNextClip();
              // play idx 2 to have video started during animation
              _clips[2].play();
              // stop idx 1 to have video stopped during animation
              _clips[1].pause();
            } else if (!_clips[1].ended) { // check if video is done -> next clip
              for (let i = 0; i < 4; i++) {
                if (i === 1) {
                  _clips[i].volume = (props.opts?.volume ?? 0) / 100;
                  _clips[i].play();
                } else {
                  _clips[i].volume = 0;
                  _clips[i].pause();
                }
              }
            }
          }, 100);
        });
      });
    });

    watch(currentClip, () => getClipsSet());

    const getClipsSet = () => {
      if (clips.value.length === 0) {
        return clipsSet.value;
      }

      clipsSet.value = [];
      for (let i = currentClip.value, j = 0; j < 4; i++, j++) {
        if (typeof clips.value[i] === 'undefined') {
          i = i % clips.value.length;
        }
        clipsSet.value.push(cloneDeep(clips.value[i]));
      }

      nextTick(() => {
        const _clips = Array.from(document.getElementsByClassName('clips')) as HTMLVideoElement[];
        // on next tick we need to set proper opacities to 0.5
        (document.getElementById('carousel') as HTMLElement).style.left = offset.value + 'px';
        if (_clips.length > 0) {
          for (let j = 0; j < 4; j++) {
            if (j === 1) {
              _clips[j].style.opacity = '1';
              _clips[j].style.filter = 'grayscale(0)';
            } else {
              _clips[j].style.opacity = String(0.5);
              _clips[j].style.filter = 'grayscale(1)';
            }
          }
        }
      });
    };

    const fillToFourClips = (_clips: any) => {
      if (_clips.length >= 4 || _clips.length === 0) {
        return _clips;
      } else {
        const filledClips = [..._clips];
        for (let i = 0, length = _clips.length, idx = 0; i < 4 - length % 4; i++) {
          if (_clips[idx]) {
            filledClips.push(cloneDeep(_clips[idx]));
            idx++;
          } else {
            filledClips.push(cloneDeep(_clips[0]));
            idx = 1;
          }
        }
        return filledClips;
      }
    };

    const moveToNextClip = () => {
      if (offset.value > 0) {
        // we cannot have + offset, try again
        setOffset();
        moveToNextClipInProgress.value = true;
        // nextTick(this.moveToNextClip);
        return;
      }
      if (stopAnimation.value) {
        return;
      }

      moveToNextClipInProgress.value = true;

      const _clips = Array.from(document.getElementsByClassName('clips')) as HTMLVideoElement[];

      if (_clips.length === 0 || _clips.length < 4) {
        return console.error('No clips were found');
      }

      gsap.to(document.getElementById('carousel'), { duration: 1, left: nextOffset.value + 'px' });

      for (let i = 0; i < 4; i++) {
        let opacity = 0.5;
        let filter = 'grayscale(1)';
        if (i === 2) {
          opacity = 1;
          filter = 'grayscale(0)';
        }
        gsap.to(_clips[i], {
          duration:   1,
          opacity,
          filter,
          onComplete: () => {
            nextTick(() => {
            // on next tick we need to set proper opacities to 0.5
              gsap.killTweensOf(_clips[i]); // we need to kill tweens as it skip to incorrect videos
              setTimeout(() => {
                if (i === 3) {
                  if (currentClip.value + 1 === clips.value.length) {
                    currentClip.value = 0; // go from beggining to not overcalculate
                  } else {
                    currentClip.value++; // move to next on the end
                  }
                }
                moveToNextClipInProgress.value = false;
                setTimeout(() => {
                  isReady.value = true;
                }, 1000);
              }, 1000);
            });
          },
        });
      }
    };

    return {
      isDebug,
      stopAnimation,
      clipsSet,
      clips,
      currentClip,
      offset,
      nextOffset,
      moveToNextClipInProgress,
      isReady,
    };
  },
});
</script>

<style scoped>
  video {
    width: 40vw;
    padding: 5vw;
    display: inline-block;
  }

  .debug {
    z-index: 9999;
    background-color: rgba(0, 0, 0, 0.5);
    position: absolute;
    color: white;
    padding: 1rem;
  }
</style>
