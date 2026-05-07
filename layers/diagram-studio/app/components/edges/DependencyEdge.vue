<script setup lang="ts">
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@vue-flow/core'
import { computed } from '#imports'

const props = defineProps<{
    id: string
    sourceX: number
    sourceY: number
    targetX: number
    targetY: number
    sourcePosition?: string
    targetPosition?: string
    label?: string
    data?: { kind?: 'imports' | 'calls' | 'extends' | 'uses' | 'navigates' }
}>()

const DASH_MAP: Record<string, string> = {
    imports: '0',
    calls: '5,3',
    extends: '8,4',
    uses: '0',
    navigates: '0'
}

const STROKE_MAP: Record<string, string> = {
    imports: '#64748b',
    calls: '#818cf8',
    extends: '#f472b6',
    uses: '#94a3b8',
    navigates: '#34d399'
}

const STROKE_WIDTH_MAP: Record<string, number> = {
    imports: 1.5,
    calls: 1.5,
    extends: 2,
    uses: 1,
    navigates: 2
}

const kind = computed(() => props.data?.kind ?? 'imports')
const strokeDasharray = computed(() => DASH_MAP[kind.value] ?? '0')
const stroke = computed(() => STROKE_MAP[kind.value] ?? '#64748b')
const strokeWidth = computed(() => STROKE_WIDTH_MAP[kind.value] ?? 1.5)

const [path, labelX, labelY] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY
})
</script>

<template>
    <BaseEdge
        :id="id"
        :path="path"
        :style="{
            stroke,
            strokeWidth,
            strokeDasharray
        }"
        aria-label="`의존성 엣지: ${data?.kind ?? 'imports'}`"
    />
    <EdgeLabelRenderer v-if="label">
        <div
            :style="{
                transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`
            }"
            class="dependency-edge__label nodrag nopan"
        >
            {{ label }}
        </div>
    </EdgeLabelRenderer>
</template>

<style scoped>
.dependency-edge__label {
    position: absolute;
    font-size: 0.625rem;
    color: var(--ds-text-muted, #888);
    background: var(--ds-bg, #0f0f0f);
    padding: 1px 4px;
    border-radius: 3px;
    pointer-events: none;
}
</style>
