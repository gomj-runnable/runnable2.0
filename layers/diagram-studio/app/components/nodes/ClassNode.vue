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
    types: 'class-node--types',
    schemas: 'class-node--schemas',
    services: 'class-node--services'
}

const kindClass = computed(() => KIND_COLORS[props.data.kind ?? ''] ?? 'class-node--types')

const memberCount = computed(() => {
    const meta = props.data.meta
    if (!meta) return null
    const count = meta.memberCount ?? meta.members
    if (typeof count === 'number') return count
    if (Array.isArray(count)) return count.length
    return null
})
</script>

<template>
    <div :class="['class-node', kindClass]" :aria-label="`클래스 노드: ${data.label}`">
        <Handle type="target" :position="Position.Left" />
        <div class="class-node__header">
            <span class="class-node__kind">{{ data.kind ?? 'type' }}</span>
            <span class="class-node__label">{{ data.label }}</span>
            <span v-if="memberCount != null" class="class-node__members"
                >{{ memberCount }}개 멤버</span
            >
        </div>
        <Handle type="source" :position="Position.Right" />
    </div>
</template>

<style scoped>
.class-node {
    border: 1px solid var(--ds-border, #2a2a2a);
    border-radius: 4px;
    background: var(--ds-bg-elevated, #1a1a1a);
    min-width: 140px;
    overflow: hidden;
}

.class-node__header {
    padding: 5px 10px;
    display: flex;
    flex-direction: column;
    gap: 1px;
}

.class-node__kind {
    font-size: 0.625rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
}

.class-node__label {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--ds-text, #e5e5e5);
}

.class-node__members {
    font-size: 0.625rem;
    color: var(--ds-text-muted, #888);
    margin-top: 1px;
}

.class-node--types {
    border-color: #1d4ed8;
}
.class-node--types .class-node__kind {
    color: #93c5fd;
}

.class-node--schemas {
    border-color: #15803d;
}
.class-node--schemas .class-node__kind {
    color: #86efac;
}

.class-node--services {
    border-color: #b45309;
}
.class-node--services .class-node__kind {
    color: #fcd34d;
}
</style>
