<template>
  <div />
</template>

<script setup lang="ts">
import { switchScenes } from '@sogebot/backend/src/helpers/obswebsocket/listeners';
import { taskRunner } from '@sogebot/backend/src/helpers/obswebsocket/taskrunner';
import { getCurrentIP } from '@sogebot/ui-helpers/getCurrentIP';
import { getSocket } from '@sogebot/ui-helpers/socket';
import OBSWebSocket from 'obs-websocket-js';

type Props = {
  opts: {
    allowedIPs: string[],
  }
};

const props = defineProps<Props>();
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
      await obs.connect(address);
    } else {
      await obs.connect(address, password);
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

  await new Promise<void>((resolve) => {
    getSocket('/', true).emit('integration::obswebsocket::values', (data) => {
      address = data.address;
      password = data.password;
      resolve();
    });
  });
  connect();

  getSocket('/', true).on('integration::obswebsocket::trigger', async (opts, cb) => {
    console.log('integration::obswebsocket::trigger', opts);
    cb(); // resolve first so connection is OK
    try {
      await taskRunner(obs, opts);
    } catch (e) {
      console.error(e);
    }
  });

  // add listeners
  switchScenes(obs, getSocket('/', true) as any);
});
</script>
