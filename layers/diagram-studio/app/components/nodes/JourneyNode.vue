<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

defineProps<{
    data: {
        label: string
        group?: string
        kind?: string
        stepNumber?: number
        meta?: Record<string, unknown>
    }
}>()
</script>

<template>
    <div class="journey-node" :aria-label="`여정 단계: ${data.label}`">
        <Handle type="target" :position="Position.Left" />
        <span v-if="data.stepNumber != null" class="journey-node__step">{{ data.stepNumber }}</span>
        <span class="journey-node__label">{{ data.label }}</span>
        <Handle type="source" :position="Position.Right" />
    </div>
</template>

<style scoped>
.journey-node {
    padding: 8px 18px;
    border: 2px solid var(--ds-primary, #6ee7b7);
    border-radius: 9999px;
    background: var(--ds-bg-elevated, #1a1a1a);
    font-size: 0.75rem;
    color: var(--ds-text, #e5e5e5);
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 6px;
}

.journey-node__step {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--ds-primary, #6ee7b7);
    color: #0f0f0f;
    font-size: 0.625rem;
    font-weight: 700;
    flex-shrink: 0;
}

.journey-node__label {
    font-weight: 500;
}
</style>
