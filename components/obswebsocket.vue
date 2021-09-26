<template>
  <div />
</template>

<script lang="ts">
import { getCurrentIP } from '@sogebot/ui-helpers/getCurrentIP';
import { getSocket } from '@sogebot/ui-helpers/socket';
import { defineComponent, onMounted } from '@vue/composition-api';
import OBSWebSocket from 'obs-websocket-js';

import type { OBSWebsocketInterface } from '~/.bot/src/database/entity/obswebsocket';
import { switchScenes } from '~/.bot/src/helpers/obswebsocket/listeners';
import { listScenes } from '~/.bot/src/helpers/obswebsocket/scenes';
import { getSourcesList, getSourceTypesList } from '~/.bot/src/helpers/obswebsocket/sources';
import { taskRunner } from '~/.bot/src/helpers/obswebsocket/taskrunner';

type Props = {
  opts: {
    allowedIPs: string[],
  }
};

export default defineComponent({
  props: { opts: Object },
  setup (props: Props) {
    const obs = new OBSWebSocket();
    obs.on('error', (err) => {
      console.error('socket error:', err);
      setTimeout(() => { connect(); }, 1000);
    });

    let address = '';
    let password = '';

    const connect = async () => {
      try {
        if (password === '') {
          await obs.connect({ address });
        } else {
          await obs.connect({ address, password });
        }
      } catch (e) {
        console.error(e);
        // try to reconnect
        setTimeout(() => { connect(); }, 1000);
      }
    };

    onMounted(async () => {
      console.log('====== OBS WEBSOCKET ======');
      if (props.opts.allowedIPs.length > 0) {
        const currentIP = await getCurrentIP();
        if (props.opts.allowedIPs.includes(currentIP)) {
          console.log(`IP ${currentIP} have access to this OBSWebsocket overlay.`);
        } else {
          console.error(`IP ${currentIP} DON'T have access to this OBSWebsocket overlay.`);
          return;
        }
      } else {
        console.log(`There is no IP restrictions set.`);
      }

      address = await new Promise((resolve, reject) => {
        getSocket('/integrations/obswebsocket', true).emit('get.value', 'address', (err: null | Error, val: string) => {
          if (err) {
            reject(err);
          } else {
            resolve(val);
          }
        });
      });
      password = await new Promise((resolve, reject) => {
        getSocket('/integrations/obswebsocket', true).emit('get.value', 'password', (err: null | Error, val: string) => {
          if (err) {
            reject(err);
          } else {
            resolve(val);
          }
        });
      });
      connect();

      getSocket('/integrations/obswebsocket', true).on('integration::obswebsocket::trigger', async (tasks: OBSWebsocketInterface['simpleModeTasks'] | string, cb: any) => {
        console.log('integration::obswebsocket::trigger', tasks);
        cb(); // resolve first so connection is OK
        try {
          await taskRunner(obs, tasks);
        } catch (e) {
          console.error(e);
        }
      });

      getSocket('/integrations/obswebsocket', true).on('integration::obswebsocket::function', async (fnc: any, cb: any) => {
        console.debug('integration::obswebsocket::function', fnc);
        switch (fnc) {
          case 'getSourcesList':
            // eslint-disable-next-line node/no-callback-literal
            return cb(await getSourcesList(obs));
          case 'getTypesList':
            // eslint-disable-next-line node/no-callback-literal
            return cb(await getSourceTypesList(obs));
          case 'listScenes':
            // eslint-disable-next-line node/no-callback-literal
            return cb(await listScenes(obs));
        }
        console.error('Unknown function');
      });

      // add listeners
      switchScenes(obs, getSocket('/integrations/obswebsocket', true));
    });
  },
});
</script>
