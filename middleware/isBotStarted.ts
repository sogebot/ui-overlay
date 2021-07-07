import { setLocale } from '@sogebot/ui-helpers/dayjsHelper';
import { getListOf, populateListOf } from '@sogebot/ui-helpers/getListOf';
import { isBotStarted } from '@sogebot/ui-helpers/isBotStarted';
import { isUserLoggedIn } from '@sogebot/ui-helpers/isUserLoggedIn';
import { getConfiguration, getTranslations } from '@sogebot/ui-helpers/socket';
import { cloneDeep } from 'lodash';

export default function ({ store }: { store: any, app: any }) {
  (async function init () {
    await isBotStarted(store);
    await getTranslations();
    const configuration = await getConfiguration();
    store.commit('setConfiguration', configuration);
    setLocale(configuration.lang as string);
    store.commit('setUILoaded');
  })();
}
