<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { computed } from '#imports'

const props = defineProps<{
    data: {
        label: string
        group?: string
        kind?: string
        rankdir?: string
        stepNumber?: number
        meta?: Record<string, unknown>
    }
}>()

const targetPos = computed(() => props.data.rankdir === 'TB' ? Position.Top : Position.Left)
const sourcePos = computed(() => props.data.rankdir === 'TB' ? Position.Bottom : Position.Right)
</script>

<template>
    <div
        class="px-[18px] py-2 border-2 border-emerald-400 rounded-full bg-neutral-950 text-xs text-neutral-100 whitespace-nowrap flex items-center gap-1.5"
        :aria-label="`여정 단계: ${data.label}`"
    >
        <Handle type="target" :position="targetPos" />
        <span
            v-if="data.stepNumber != null"
            class="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-emerald-400 text-neutral-950 text-[0.625rem] font-bold flex-shrink-0"
            >{{ data.stepNumber }}</span
        >
        <span class="font-medium">{{ data.label }}</span>
        <Handle type="source" :position="sourcePos" />
    </div>
</template>
