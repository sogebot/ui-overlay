<template>
  <div />
</template>

<script setup lang="ts">
import { switchScenes, inputMuted } from '@sogebot/backend/src/helpers/obswebsocket/listeners';
import { taskRunner } from '@sogebot/backend/src/helpers/obswebsocket/taskrunner';
import { getCurrentIP } from '@sogebot/ui-helpers/getCurrentIP';
import { getSocket } from '@sogebot/ui-helpers/socket';
import OBSWebSocket from 'obs-websocket-js';

type Props = {
  opts: {
    allowedIPs: string[];
    password: string;
    address: string;
  }
};

const props = defineProps<Props>();
const obs = new OBSWebSocket();

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

  try {
    if (props.opts.password === '') {
      await obs.connect(props.opts.address);
    } else {
      await obs.connect(props.opts.address, props.opts.password);
    }
  } catch (e) {
    console.error(e);
  }

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
  inputMuted(obs, getSocket('/', true) as any);
});
</script>
