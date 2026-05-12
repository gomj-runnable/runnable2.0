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
import type { DiagramNode, DiagramEdge } from '../../runtime/types'
import ModuleNode from './nodes/ModuleNode.vue'
import JourneyNode from './nodes/JourneyNode.vue'
import ClassNode from './nodes/ClassNode.vue'
import CallableNode from './nodes/CallableNode.vue'
import DependencyEdge from './edges/DependencyEdge.vue'

const props = defineProps<{
    src: string
    nodeKindMap?: NodeTypesObject
    selectedGroups?: string[]
    searchQuery?: string
    kind?: string
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
    dependency: DependencyEdge as unknown as EdgeTypesObject[string]
}

const isEmpty = computed(() => !pending.value && !error.value && data.value?.nodes?.length === 0)

const codegenError = computed(() => data.value?.meta?.error ?? null)

const manifestHint = computed(() => {
    const k = props.kind ?? data.value?.kind ?? ''
    if (!k) return 'layers/diagram-studio/manifests/'
    return `layers/diagram-studio/manifests/${k}/`
})

const lastBuildAt = computed(() => {
    const ts = data.value?.meta?.generatedAt
    if (!ts) return null
    return new Date(ts).toLocaleString('ko-KR')
})

function matchesQuery(n: DiagramNode, q: string): boolean {
    if (!q) return false
    return (n.label || n.id).toLowerCase().includes(q) || n.id.toLowerCase().includes(q)
}

function filterDiagram(
    rawNodes: DiagramNode[],
    rawEdges: DiagramEdge[]
): { nodes: DiagramNode[]; edges: DiagramEdge[]; matchedIds: string[] } {
    const groups = props.selectedGroups ?? []
    const q = (props.searchQuery ?? '').trim().toLowerCase()

    // 그룹 필터는 가시성 제어. 검색어는 강조만 (노드는 모두 표시).
    let visibleNodes = rawNodes
    if (groups.length > 0) {
        visibleNodes = visibleNodes.filter((n) => !!n.group && groups.includes(n.group))
    }
    const matchedIds = q ? visibleNodes.filter((n) => matchesQuery(n, q)).map((n) => n.id) : []
    const visibleIds = new Set(visibleNodes.map((n) => n.id))
    const filteredEdges = rawEdges.filter(
        (e) => visibleIds.has(e.source) && visibleIds.has(e.target)
    )
    return { nodes: visibleNodes, edges: filteredEdges, matchedIds }
}

watch(
    [() => data.value, () => props.selectedGroups, () => props.searchQuery] as const,
    async ([diagram]) => {
        if (!diagram) {
            nodes.value = []
            edges.value = []
            return
        }
        const filtered = filterDiagram(diagram.nodes, diagram.edges)
        const layout = applyLayout(filtered.nodes, filtered.edges, {
            diagramKind: props.kind ?? diagram.kind
        })
        const matchedSet = new Set(filtered.matchedIds)
        // 클러스터 모드에서는 layout 노드 id 가 `${originalId}__${clusterKey}` 로 prefix 된다.
        // 검색/하이라이트/fitView 는 모두 originalId 로 매칭하고, 매칭된 모든 복제 인스턴스를 함께 강조한다.
        const matchedLayoutIds: string[] = []
        nodes.value = layout.nodes.map((n) => {
            const originalId =
                ((n.data as Record<string, unknown> | undefined)?.originalId as
                    | string
                    | undefined) ?? n.id
            const isMatched = matchedSet.has(originalId)
            if (isMatched) matchedLayoutIds.push(n.id)
            return {
                ...n,
                class: isMatched
                    ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-neutral-950 rounded-lg'
                    : undefined,
                data: { ...(n.data ?? {}), highlighted: isMatched }
            }
        })
        edges.value = layout.edges
        await nextTick()
        if (matchedLayoutIds.length > 0) {
            fitView({ nodes: matchedLayoutIds, padding: 0.25 })
        } else {
            fitView({ padding: 0.15 })
        }
    },
    { immediate: true, deep: true }
)

function onNodeClick({ node }: NodeMouseEvent) {
    // 클러스터 복제 노드는 id 가 prefix 되어 있으므로 NodeDetailPanel 등 외부에는 originalId 를 노출한다.
    const originalId =
        ((node.data as Record<string, unknown> | undefined)?.originalId as string | undefined) ??
        node.id
    const raw: DiagramNode = {
        id: originalId,
        label: node.data?.label ?? originalId,
        group: node.data?.group,
        kind: node.data?.kind,
        data: node.data?.meta
    }
    emit('node-select', raw)
}
</script>

<template>
    <div class="w-full h-full relative" aria-label="다이어그램 캔버스">
        <div v-if="pending" class="flex items-center justify-center h-full text-sm text-muted">
            로딩 중...
        </div>
        <div v-else-if="error" class="flex items-center justify-center h-full">
            <UAlert
                color="error"
                variant="subtle"
                icon="i-lucide-triangle-alert"
                title="다이어그램을 불러오지 못했습니다."
                class="max-w-[420px]"
            />
        </div>
        <div v-else-if="isEmpty" class="flex items-center justify-center h-full">
            <UAlert
                :color="codegenError ? 'warning' : 'info'"
                variant="subtle"
                :icon="codegenError ? 'i-lucide-triangle-alert' : 'i-lucide-info'"
                :title="
                    codegenError
                        ? '다이어그램 생성 중 오류가 발생했습니다.'
                        : '아직 생성된 다이어그램이 없습니다.'
                "
                class="max-w-[420px]"
            >
                <template #description>
                    <div class="flex flex-col gap-1.5">
                        <p v-if="codegenError" class="m-0 text-xs">
                            <code
                                class="font-mono text-[0.6875rem] text-default bg-warning/10 px-2 py-1 rounded inline-block break-all"
                                >{{ codegenError }}</code
                            >
                        </p>
                        <p class="m-0 text-xs text-muted">
                            <UKbd value="pnpm gen:diagrams" size="sm" />
                            를 실행하세요.
                        </p>
                        <p class="m-0 text-xs text-muted">
                            manifest 경로:
                            <code
                                class="font-mono text-[0.6875rem] text-primary bg-primary/10 px-1.5 py-0.5 rounded"
                                >{{ manifestHint }}</code
                            >
                        </p>
                        <p v-if="lastBuildAt" class="m-0 text-xs text-muted">
                            마지막 빌드: <span>{{ lastBuildAt }}</span>
                        </p>
                    </div>
                </template>
            </UAlert>
        </div>
        <VueFlow
            v-else
            v-model:nodes="nodes"
            v-model:edges="edges"
            :node-types="nodeTypes"
            :edge-types="edgeTypes"
            class="w-full h-full"
            @node-click="onNodeClick"
        >
            <Background />
            <Controls />
            <MiniMap
                node-color="var(--ui-color-neutral-500)"
                mask-color="rgba(0,0,0,0.6)"
                pannable
                zoomable
            />
        </VueFlow>
    </div>
</template>
