<template>
  <v-app
    v-if="$store.state.isUILoaded"
    style="width: 100%; height: 100%;"
  >
    <v-main v-if="item" v-html="item.body || ''" />
  </v-app>
</template>

<script setup lang="ts">
import { getSocket } from '@sogebot/ui-helpers/socket';
import safeEval from 'safe-eval';

const props = defineProps({ opts: Object });
const item = ref<null | { body: string, javascript: string }>(null);

onMounted(() => {
  getSocket('/core/plugins').emit('generic::getOne', props.opts?.pluginId, (err, plugin) => {
    if (err || !plugin) {
      return console.error(err || 'Plugin not found');
    }
    console.log(`=== PLUGIN ${plugin.id} LOADED ===`);
    item.value = plugin;

    try {
      const workflow = JSON.parse(plugin.workflow).drawflow.Home.data;
      for (const node of Object.values<any>(workflow)) {
        const nodeId = node.data.value;
        if (nodeId === props.opts?.nodeId) {
          item.value = JSON.parse(node.data.data);

          // eslint-disable-next-line no-eval
          eval(item.value?.javascript || '');

          console.log(`==== NODE ${nodeId} FOUND ====`);

          (getSocket('/core/plugins') as any).on(`plugins::${nodeId}::runScript`, ({ script, sandbox } : { script: string, sandbox: string }) => {
            safeEval(
              script, sandbox,
            );
          });
          break;
        }
      }
    } catch (e) {
      console.log('Something went wrong.', e);
    }
  });
});
</script>
