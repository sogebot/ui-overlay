import fs from 'fs';

import { defineNuxtConfig } from '@nuxt/bridge';

const packageJson = String(fs.readFileSync('./package.json'));
const version = JSON.parse(packageJson).version || 0;

export default defineNuxtConfig({
  // Target: https://go.nuxtjs.dev/config-target
  target: 'static',
  ssr:    false,

  env: {
    isNuxtDev: process.env.NODE_ENV === 'development', BUILD: 'web', version,
  },

  bridge: { nitro: process.env.NODE_ENV === 'development' },

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

  plugins: [
    '~/plugins/graphql-config',
    '~/plugins/log-version.client',
  ],

  router: { base: '/overlays' },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
    '@/assets/letter-animations.scss',
    '@/assets/colors.scss',
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    'nuxt-graphql-request',
    // https://go.nuxtjs.dev/stylelint
    '@nuxtjs/stylelint-module',
    // https://go.nuxtjs.dev/vuetify
    ['@nuxtjs/vuetify', { treeShake: true }],
  ],

  vuetify: { icons: { iconfont: 'mdiSvg' } },
  graphql: { clients: { default: { endpoint: '/graphql' } } },
  alias:   { tslib: 'tslib/tslib.es6.js' },
});
