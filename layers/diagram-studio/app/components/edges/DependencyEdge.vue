<script setup lang="ts">
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, Position } from '@vue-flow/core'
import { computed } from '#imports'

const props = defineProps<{
    id: string
    sourceX: number
    sourceY: number
    targetX: number
    targetY: number
    sourcePosition?: Position
    targetPosition?: Position
    label?: string
    data?: { kind?: 'imports' | 'calls' | 'extends' | 'uses' | 'navigates' }
}>()

const DASH_MAP: Record<string, string> = {
    imports: '0',
    calls: '6,3',
    extends: '10,4',
    uses: '4,2',
    navigates: '0'
}

const STROKE_MAP: Record<string, string> = {
    imports: 'var(--ui-color-neutral-300)',
    calls: 'var(--ui-color-primary-300)',
    extends: 'var(--ui-color-warning-300)',
    uses: 'var(--ui-color-neutral-200)',
    navigates: 'var(--ui-color-success-300)'
}

const STROKE_WIDTH_MAP: Record<string, number> = {
    imports: 2,
    calls: 2,
    extends: 2.5,
    uses: 1.5,
    navigates: 2.5
}

const kind = computed(() => props.data?.kind ?? 'imports')
const strokeDasharray = computed(() => DASH_MAP[kind.value] ?? '0')
const stroke = computed(() => STROKE_MAP[kind.value] ?? '#64748b')
const strokeWidth = computed(() => STROKE_WIDTH_MAP[kind.value] ?? 2)
const markerId = computed(() => `arrow-${props.id}`)

const [path, labelX, labelY] = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
    borderRadius: 8
})
</script>

<template>
    <svg style="position: absolute; width: 0; height: 0; overflow: hidden">
        <defs>
            <marker
                :id="markerId"
                markerWidth="12"
                markerHeight="12"
                refX="10"
                refY="3.5"
                orient="auto"
                markerUnits="strokeWidth"
            >
                <path d="M0,0 L0,7 L11,3.5 z" :fill="stroke" />
            </marker>
        </defs>
    </svg>
    <BaseEdge
        :id="id"
        :path="path"
        :style="{
            stroke,
            strokeWidth,
            strokeDasharray
        }"
        :marker-end="`url(#${markerId})`"
        :aria-label="`의존성 엣지: ${data?.kind ?? 'imports'}`"
    />
    <EdgeLabelRenderer v-if="label">
        <div
            :style="{
                transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`
            }"
            class="absolute text-[0.625rem] text-neutral-400 bg-neutral-950 px-1.5 py-px rounded border border-neutral-700 pointer-events-none whitespace-nowrap nodrag nopan"
        >
            {{ label }}
        </div>
    </EdgeLabelRenderer>
</template>
