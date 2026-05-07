<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { computed } from '#imports'

const props = defineProps<{
    data: {
        label: string
        group?: string
        kind?: string
        meta?: Record<string, unknown>
    }
}>()

const KIND_COLORS: Record<string, string> = {
    facade: 'callable-node--amber',
    store: 'callable-node--emerald',
    sideeffect: 'callable-node--rose',
    action: 'callable-node--sky'
}

const kindClass = computed(() => KIND_COLORS[props.data.kind ?? ''] ?? 'callable-node--slate')
</script>

<template>
    <div :class="['callable-node', kindClass]" :aria-label="`callable 노드: ${data.label}`">
        <Handle type="target" :position="Position.Left" />
        <div class="callable-node__inner">
            <span class="callable-node__kind">{{ data.kind ?? 'composable' }}</span>
            <span class="callable-node__label">{{ data.label }}</span>
        </div>
        <Handle type="source" :position="Position.Right" />
    </div>
</template>

<style scoped>
.callable-node {
    padding: 5px 12px;
    border: 1px solid var(--ds-border, #2a2a2a);
    border-radius: 6px;
    background: var(--ds-bg-elevated, #1a1a1a);
    min-width: 130px;
}

.callable-node__inner {
    display: flex;
    flex-direction: column;
    gap: 1px;
}

.callable-node__kind {
    font-size: 0.625rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
}

.callable-node__label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--ds-text, #e5e5e5);
}

.callable-node--amber {
    border-color: #d97706;
    background: #1c1200;
}
.callable-node--amber .callable-node__kind {
    color: #fbbf24;
}

.callable-node--emerald {
    border-color: #059669;
    background: #001a0e;
}
.callable-node--emerald .callable-node__kind {
    color: #34d399;
}

.callable-node--rose {
    border-color: #e11d48;
    background: #1a0008;
}
.callable-node--rose .callable-node__kind {
    color: #fb7185;
}

.callable-node--sky {
    border-color: #0284c7;
    background: #00111a;
}
.callable-node--sky .callable-node__kind {
    color: #38bdf8;
}

.callable-node--slate {
    border-color: #475569;
    background: #1a1a1a;
}
.callable-node--slate .callable-node__kind {
    color: #94a3b8;
}
</style>
