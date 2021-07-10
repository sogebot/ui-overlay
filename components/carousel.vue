<template>
  <div>
    <img v-for="e of images" v-show="currentImage === e.order" :id="e.id" :key="e.id" :src="e.imageUrl">
  </div>
</template>

<script lang="ts">
import {
  defineComponent, onMounted, ref, useContext,
} from '@nuxtjs/composition-api';
import gsap from 'gsap';

export default defineComponent({
  setup () {
    const currentImage = ref(null as any);
    const ready = ref(true);
    const images = ref([] as any[]);
    const { $axios } = useContext();

    onMounted(() => {
      $axios.get(location.origin + '/api/v1/carousel').then((response) => {
        images.value = response.data.data;
        setInterval(() => {
          triggerAnimation();
        });
      });
    });

    const wait = (type: string) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => resolve(), images.value[currentImage.value][type]);
      });
    };

    const doEnterAnimation = () => {
      let animation: any = { opacity: 1 };

      const el = document.getElementById(images.value[currentImage.value].id) as HTMLElement;

      // force refresh of styles
      el.style.filter = 'blur(0px)';
      el.style.top = '0';
      el.style.left = '0';
      el.style.opacity = '0';

      switch (images.value[currentImage.value].animationIn) {
        case 'blurIn':
          el.style.filter = 'blur(50px)';
          animation = { filter: 'blur(0px)', opacity: 1 };
          break;
        case 'slideUp':
          el.style.opacity = '1';
          el.style.top = window.innerHeight + 'px';
          animation = { top: 0 };
          break;
        case 'slideDown':
          el.style.opacity = '1';
          el.style.top = -el.clientHeight + 'px';
          animation = { top: 0 };
          break;
        case 'slideLeft':
          el.style.opacity = '1';
          el.style.left = window.innerWidth + 'px';
          animation = { left: 0 };
          break;
        case 'slideRight':
          el.style.opacity = '1';
          el.style.left = -el.clientWidth + 'px';
          animation = { left: 0 };
          break;
      }

      return new Promise<void>((resolve) => {
        gsap.to(el, {
          duration:   images.value[currentImage.value].animationInDuration / 1000,
          ...animation,
          onComplete: () => {
            resolve();
          },
        });
      });
    };

    const doLeaveAnimation = () => {
      let animation: any = { opacity: 0 };
      const el = document.getElementById(images.value[currentImage.value].id) as HTMLElement;

      switch (images.value[currentImage.value].animationOut) {
        case 'blurOut':
          animation = { filter: 'blur(50px)', opacity: 0 };
          break;
        case 'slideUp':
          animation = { top: -el.clientHeight + 'px' };
          break;
        case 'slideDown':
          animation = { top: window.innerHeight + 'px' };
          break;
        case 'slideLeft':
          animation = { left: -el.clientWidth + 'px' };
          break;
        case 'slideRight':
          animation = { left: window.innerWidth + 'px' };
          break;
      }

      return new Promise<void>((resolve) => {
        gsap.to(el, {
          duration:   images.value[currentImage.value].animationOutDuration / 1000,
          ...animation,
          onComplete: () => {
            resolve();
          },
        });
      });
    };

    const triggerAnimation = async () => {
      if (ready.value && images.value.length > 0) {
        ready.value = false;
        if (currentImage.value === null) {
          currentImage.value = 0;
        } else {
          currentImage.value++;
        }
        if (images.value.length <= currentImage.value) {
          currentImage.value = 0;
        }

        await wait('waitBefore');
        await doEnterAnimation();
        await wait('duration');
        await doLeaveAnimation();
        await wait('waitAfter');
        ready.value = true;
      }
    };

    return { images, currentImage };
  },
});
</script>

<style scoped>
img {
  width: 100%;
  opacity: 0;
  position: absolute;
}
</style>
