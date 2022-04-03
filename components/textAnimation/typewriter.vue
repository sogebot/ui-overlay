<template>
  <span>
    <span
      v-for="(char, index) of text.split('')"
      :key="char + index + options.speed"
      class="animate__animated animate__fadeIn"
      :class="['animate__' + options.speed]"
      :style="{
        'animation-timing-function': 'steps(1, end)',
        'animation-duration': `${options.speed}ms`,
        'animation-delay': (index * options.speed) + 'ms',
      }"
    >{{ char === ' ' ? '&nbsp;' : char }}</span>
  </span>
</template>

<script setup lang="ts">
defineProps({
  text:    String,
  options: Object,
});
</script>
