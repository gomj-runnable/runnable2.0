<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { computed } from '#imports'

const props = defineProps<{
    data: { label: string; group?: string; kind?: string; meta?: Record<string, unknown> }
}>()

const GROUP_ACCENT: Record<string, string> = {
    widgets: 'border-l-violet-600',
    features: 'border-l-indigo-700',
    entities: 'border-l-cyan-700',
    shared: 'border-l-slate-500'
}

const accentClass = computed(() => GROUP_ACCENT[props.data.group ?? ''] ?? 'border-l-slate-500')
</script>

<template>
    <div
        class="nodrag px-3 pt-1.5 pb-1.5 pl-2.5 border border-neutral-700 border-l-[3px] rounded-md bg-neutral-950 text-xs flex flex-col gap-0.5 min-w-[120px]"
        :class="accentClass"
        :aria-label="`모듈 노드: ${data.label}`"
    >
        <Handle type="target" :position="Position.Left" />
        <span
            v-if="data.group"
            class="text-[0.625rem] uppercase tracking-[0.05em] font-semibold text-neutral-400"
            >{{ data.group }}</span
        >
        <span class="text-neutral-100 font-medium">{{ data.label }}</span>
        <Handle type="source" :position="Position.Right" />
    </div>
</template>
