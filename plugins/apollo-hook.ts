import { Context } from '@nuxt/types';
import {
  defineNuxtPlugin, onGlobalSetup, provide,
} from '@nuxtjs/composition-api';
import { DefaultApolloClient } from '@vue/apollo-composable';

/**
 * This plugin will connect @nuxt/apollojs with @vue/apollo-composable
 */

export default defineNuxtPlugin(({ app }: Context): void => {
  onGlobalSetup(() => {
    provide(DefaultApolloClient, app.apolloProvider?.defaultClient);
  });
});
