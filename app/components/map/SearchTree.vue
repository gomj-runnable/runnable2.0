<script setup lang="ts">
import type { BaseNode } from '#shared/types/theme-map'

const props = defineProps<{ nodes: BaseNode[] }>()
const emit = defineEmits<{ nodeClick: [node: BaseNode] }>()
</script>

<template>
  <ul class="tree-list">
    <li v-for="node in props.nodes" :key="node.id">
      <template v-if="node.children && node.children.length > 0">
        <details open>
          <summary :data-node-id="node.id" @click.prevent="emit('nodeClick', node)">
            {{ node.name }}
          </summary>
          <MapSearchTree :nodes="node.children" @node-click="emit('nodeClick', $event)" />
        </details>
      </template>
      <template v-else>
        <span :data-node-id="node.id" @click="emit('nodeClick', node)">{{ node.name }}</span>
      </template>
    </li>
  </ul>
</template>