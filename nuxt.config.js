import fs from 'fs';

const packageJson = fs.readFileSync('./package.json');
const version = JSON.parse(packageJson).version || 0;

export default {
  // Target: https://go.nuxtjs.dev/config-target
  target: 'static',
  ssr:    false,

  // Remove loading bar
  loading:          false,
  loadingIndicator: false,

  server: { port: 3002 },

  env: {
    isNuxtDev: process.env.NODE_ENV === 'development', BUILD: 'web', version,
  },

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title:     'sogeBot - overlay',
    htmlAttrs: { lang: 'en' },
    meta:      [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid: 'description', name: 'description', content: '',
      },
      { name: 'format-detection', content: 'telephone=no' },
    ],
    link: [
      {
        rel: 'icon', type: 'image/x-icon', href: '/favicon.ico',
      },
    ],
  },

  router: { base: '/overlays' },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
    '@/assets/letter-animations.scss',
    '@/assets/colors.scss',
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
    { src: '@/plugins/log-version.js', ssr: false },
    '@/plugins/apollo-hook.ts',
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/typescript
    '@nuxt/typescript-build',
    // https://go.nuxtjs.dev/stylelint
    '@nuxtjs/stylelint-module',
    // https://go.nuxtjs.dev/vuetify
    ['@nuxtjs/vuetify', { treeShake: true }],
    // https://composition-api.nuxtjs.org/
    '@nuxtjs/composition-api/module',
  ],

  vuetify: { icons: { iconfont: 'mdiSvg' } },

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios',
    '@nuxtjs/apollo',
  ],

  // Axios module configuration: https://go.nuxtjs.dev/config-axios
  axios: {},

  apollo: {
    includeNodeModules: true,
    clientConfigs:      { default: '~/plugins/apollo-config.js' },
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
    extend (config) {
      config.resolve.alias.vue = 'vue/dist/vue.common';
    },
  },
};
