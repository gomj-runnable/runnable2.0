<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { computed } from '#imports'

const props = defineProps<{
    data: {
        label: string
        group?: string
        kind?: string
        rankdir?: string
        meta?: Record<string, unknown>
    }
}>()

const KIND_ACCENT: Record<string, { border: string; label: string }> = {
    facade: { border: 'border-l-amber-600', label: 'text-amber-400' },
    store: { border: 'border-l-emerald-600', label: 'text-emerald-400' },
    sideeffect: { border: 'border-l-rose-600', label: 'text-rose-400' },
    action: { border: 'border-l-sky-600', label: 'text-sky-400' }
}

const accent = computed(
    () =>
        KIND_ACCENT[props.data.kind ?? ''] ?? {
            border: 'border-l-slate-500',
            label: 'text-slate-400'
        }
)
const targetPos = computed(() => props.data.rankdir === 'TB' ? Position.Top : Position.Left)
const sourcePos = computed(() => props.data.rankdir === 'TB' ? Position.Bottom : Position.Right)
</script>

<template>
    <div
        class="px-3 pt-1.5 pb-1.5 pl-2.5 border border-neutral-700 border-l-[3px] rounded-md bg-neutral-950 min-w-[130px]"
        :class="accent.border"
        :aria-label="`callable 노드: ${data.label}`"
    >
        <Handle type="target" :position="targetPos" />
        <div class="flex flex-col gap-px">
            <span
                class="text-[0.625rem] uppercase tracking-[0.05em] font-semibold"
                :class="accent.label"
                >{{ data.kind ?? 'composable' }}</span
            >
            <span class="text-xs font-medium text-neutral-100">{{ data.label }}</span>
        </div>
        <Handle type="source" :position="sourcePos" />
    </div>
</template>
