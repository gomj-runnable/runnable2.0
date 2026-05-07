<script setup lang="ts">
import { VueFlow, useVueFlow } from '@vue-flow/core'
import type {
    Node as VueFlowNode,
    Edge as VueFlowEdge,
    NodeMouseEvent,
    NodeTypesObject,
    EdgeTypesObject
} from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { computed, ref, watch, nextTick } from '#imports'
import { useDiagramData } from '../composables/useDiagramData'
import { applyLayout } from '../composables/useDagreLayout'
import type { DiagramNode } from '../../runtime/types'
import ModuleNode from './nodes/ModuleNode.vue'
import JourneyNode from './nodes/JourneyNode.vue'
import ClassNode from './nodes/ClassNode.vue'
import CallableNode from './nodes/CallableNode.vue'
import DependencyEdge from './edges/DependencyEdge.vue'

const props = defineProps<{
    src: string
    nodeKindMap?: Record<string, any>
}>()

const emit = defineEmits<{
    'node-select': [node: DiagramNode]
}>()

const { data, pending, error } = useDiagramData(props.src)
const { fitView } = useVueFlow()

const nodes = ref<VueFlowNode[]>([])
const edges = ref<VueFlowEdge[]>([])

const defaultNodeTypes = {
    module: ModuleNode,
    journey: JourneyNode,
    class: ClassNode,
    callable: CallableNode
}

const nodeTypes = computed(
    () =>
        ({
            ...defaultNodeTypes,
            ...(props.nodeKindMap ?? {})
        }) as NodeTypesObject
)

const edgeTypes: EdgeTypesObject = {
    dependency: DependencyEdge as any
}

const isEmpty = computed(() => !pending.value && !error.value && data.value?.nodes?.length === 0)

watch(
    () => data.value,
    async (diagram) => {
        if (!diagram) return
        const layout = applyLayout(diagram.nodes, diagram.edges)
        nodes.value = layout.nodes
        edges.value = layout.edges
        await nextTick()
        fitView({ padding: 0.1 })
    },
    { immediate: true }
)

function onNodeClick({ node }: NodeMouseEvent) {
    const raw: DiagramNode = {
        id: node.id,
        label: node.data?.label ?? node.id,
        group: node.data?.group,
        kind: node.data?.kind,
        data: node.data?.meta
    }
    emit('node-select', raw)
}
</script>

<template>
    <div class="diagram-canvas" aria-label="다이어그램 캔버스">
        <div v-if="pending" class="diagram-canvas__state">로딩 중...</div>
        <div v-else-if="error" class="diagram-canvas__state diagram-canvas__state--error">
            다이어그램을 불러오지 못했습니다.
        </div>
        <div v-else-if="isEmpty" class="diagram-canvas__state">
            아직 생성된 다이어그램이 없습니다. <code>pnpm gen:diagrams</code>를 실행하세요.
        </div>
        <VueFlow
            v-else
            v-model:nodes="nodes"
            v-model:edges="edges"
            :node-types="nodeTypes"
            :edge-types="edgeTypes"
            class="diagram-canvas__flow"
            @node-click="onNodeClick"
        >
            <Background />
            <Controls />
            <MiniMap />
        </VueFlow>
    </div>
</template>

<style scoped>
.diagram-canvas {
    width: 100%;
    height: 100%;
    position: relative;
}

.diagram-canvas__flow {
    width: 100%;
    height: 100%;
}

.diagram-canvas__state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    font-size: 0.875rem;
    color: var(--ds-text-muted, #888);
}

.diagram-canvas__state--error {
    color: #f87171;
}

.diagram-canvas__state code {
    font-family: monospace;
    background: var(--ds-bg-elevated, #1a1a1a);
    padding: 1px 6px;
    border-radius: 3px;
    margin-left: 4px;
}
</style>
