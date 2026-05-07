<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { computed } from '#imports'

const props = defineProps<{
    data: { label: string; group?: string; kind?: string; meta?: Record<string, unknown> }
}>()

const GROUP_COLORS: Record<string, string> = {
    widgets: 'module-node--violet',
    features: 'module-node--indigo',
    entities: 'module-node--cyan',
    shared: 'module-node--slate'
}

const colorClass = computed(() => GROUP_COLORS[props.data.group ?? ''] ?? 'module-node--slate')
</script>

<template>
    <div :class="['module-node', colorClass]" aria-label="`모듈 노드: ${data.label}`">
        <Handle type="target" :position="Position.Left" />
        <span v-if="data.group" class="module-node__group">{{ data.group }}</span>
        <span class="module-node__label">{{ data.label }}</span>
        <Handle type="source" :position="Position.Right" />
    </div>
</template>

<style scoped>
.module-node {
    padding: 6px 12px;
    border: 1px solid var(--ds-border, #2a2a2a);
    border-radius: 6px;
    background: var(--ds-bg-elevated, #1a1a1a);
    font-size: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 120px;
}

.module-node__label {
    color: var(--ds-text, #e5e5e5);
    font-weight: 500;
}

.module-node__group {
    font-size: 0.625rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
}

.module-node--violet {
    border-color: #7c3aed;
    background: #1e1427;
}
.module-node--violet .module-node__group {
    color: #a78bfa;
}

.module-node--indigo {
    border-color: #4338ca;
    background: #13143a;
}
.module-node--indigo .module-node__group {
    color: #818cf8;
}

.module-node--cyan {
    border-color: #0e7490;
    background: #071e26;
}
.module-node--cyan .module-node__group {
    color: #67e8f9;
}

.module-node--slate {
    border-color: #475569;
    background: #1a1a1a;
}
.module-node--slate .module-node__group {
    color: #94a3b8;
}
</style>
