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
    types: { border: 'border-l-blue-700', label: 'text-blue-300' },
    schemas: { border: 'border-l-green-700', label: 'text-green-300' },
    services: { border: 'border-l-amber-600', label: 'text-amber-300' }
}

const accent = computed(
    () =>
        KIND_ACCENT[props.data.kind ?? ''] ?? {
            border: 'border-l-neutral-600',
            label: 'text-neutral-400'
        }
)
const targetPos = computed(() => props.data.rankdir === 'TB' ? Position.Top : Position.Left)
const sourcePos = computed(() => props.data.rankdir === 'TB' ? Position.Bottom : Position.Right)

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
    <div
        class="border border-neutral-700 border-l-[3px] rounded bg-neutral-950 min-w-[140px] overflow-hidden"
        :class="accent.border"
        :aria-label="`클래스 노드: ${data.label}`"
    >
        <Handle type="target" :position="targetPos" />
        <div class="px-2.5 pt-1.5 pb-1.5 pl-2 flex flex-col gap-px">
            <span
                class="text-[0.625rem] uppercase tracking-[0.05em] font-semibold"
                :class="accent.label"
                >{{ data.kind ?? 'type' }}</span
            >
            <span class="text-[0.8125rem] font-semibold text-neutral-100">{{ data.label }}</span>
            <span v-if="memberCount != null" class="text-[0.625rem] text-neutral-500 mt-px"
                >{{ memberCount }}개 멤버</span
            >
        </div>
        <Handle type="source" :position="sourcePos" />
    </div>
</template>
