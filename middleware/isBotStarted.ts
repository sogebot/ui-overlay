import { setLocale } from '@sogebot/ui-helpers/dayjsHelper';
import { isBotStarted } from '@sogebot/ui-helpers/isBotStarted';
import { getConfiguration, getTranslations } from '@sogebot/ui-helpers/socket';

export default function ({ store }: { store: any }) {
  (async function init () {
    await isBotStarted(store);
    await getTranslations();
    const configuration = await getConfiguration();
    store.commit('setConfiguration', configuration);
    setLocale(configuration.lang as string);
    store.commit('setUILoaded');
  })();
}
