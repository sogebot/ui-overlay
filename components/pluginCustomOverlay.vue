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
const item = ref<null | { body: string, javascript: string, css: string }>(null);

onMounted(() => {
  getSocket('/core/plugins', true).emit('generic::getOne', props.opts?.pluginId, (err, plugin) => {
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

          console.log(`==== NODE ${nodeId} FOUND ====`);

          if ((item.value?.css || '').length > 0) {
            const head = document.getElementsByTagName('head')[0];
            const style = document.createElement('style');
            style.type = 'text/css';
            style.appendChild(document.createTextNode(item.value!.css));
            head.appendChild(style);
          }

          if ((item.value?.javascript || '').length > 0) {
            (getSocket('/core/plugins', true) as any).emit(`plugins::getSandbox`, { nodeId, pluginId: plugin.id }, (sandbox: string) => {
              safeEval(
                item.value?.javascript || '', sandbox,
              );
            });
          }

          (getSocket('/core/plugins', true) as any).on(`plugins::${nodeId}::runScript`, ({ script, sandbox } : { script: string, sandbox: Record<string, any> }) => {
            safeEval(
              script, {
                ...sandbox, window, document,
              },
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
