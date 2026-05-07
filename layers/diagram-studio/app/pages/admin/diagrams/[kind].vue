<script setup lang="ts">
import { ref, computed, watch, useRoute, navigateTo } from '#imports'
import type { DiagramNode, TabKind } from '../../../../runtime/types'
import { isTabKind } from '../../../../runtime/types'
import { useDiagramData } from '../../../composables/useDiagramData'
import { useKeyboardShortcuts } from '../../../composables/useKeyboardShortcuts'
import DashboardShell from '../../../components/DashboardShell.vue'
import DiagramTabs from '../../../components/DiagramTabs.vue'
import DiagramSearch from '../../../components/DiagramSearch.vue'
import DiagramLegend from '../../../components/DiagramLegend.vue'
import DiagramCanvas from '../../../components/DiagramCanvas.vue'
import NodeDetailPanel from '../../../components/NodeDetailPanel.vue'
import ShortcutsHelpModal from '../../../components/ShortcutsHelpModal.vue'

definePageMeta({ ssr: false })

const route = useRoute()

const TAB_SRCS: Record<TabKind, string> = {
    'user-journey': '/diagrams/user-journey.json',
    fsd: '/diagrams/fsd.json',
    composables: '/diagrams/composables.json',
    classes: '/diagrams/classes.json'
}

const activeTab = computed<TabKind>(() => {
    const k = route.params.kind
    const v = Array.isArray(k) ? k[0] : k
    return isTabKind(v) ? v : 'fsd'
})

// 잘못된 kind 진입 시 fsd 로 리다이렉트
watch(
    () => route.params.kind,
    (k) => {
        const v = Array.isArray(k) ? k[0] : k
        if (!isTabKind(v)) navigateTo('/admin/diagrams/fsd', { replace: true })
    },
    { immediate: true }
)

const searchQuery = ref('')
const selectedNode = ref<DiagramNode | null>(null)
const searchInputRef = ref<{ focus: () => void } | null>(null)
const selectedFilters = ref<string[]>([])
const helpOpen = ref(false)

const activeSrc = computed(() => TAB_SRCS[activeTab.value])
const { data } = useDiagramData(activeSrc)

const activeMeta = computed(() => data.value?.meta ?? null)

const activeGroups = computed(() => {
    if (!data.value) return []
    const seen = new Set<string>()
    for (const n of data.value.nodes) {
        if (n.group) seen.add(n.group)
    }
    return [...seen]
})

// CSS custom property tokens — resolved at runtime from the NuxtUI theme
const GROUP_COLORS: Record<string, string> = {
    widgets: 'var(--ui-color-success-500)',
    features: 'var(--ui-color-warning-500)',
    entities: 'var(--ui-color-primary-500)',
    shared: 'var(--ui-color-info-500)',
    types: 'var(--ui-color-warning-400)',
    schemas: 'var(--ui-color-success-400)',
    services: 'var(--ui-color-error-400)'
}

const legendGroups = computed(() =>
    activeGroups.value.map((g) => ({
        key: g,
        label: g,
        color: GROUP_COLORS[g] ?? 'var(--ui-color-neutral-500)'
    }))
)

function toggleFilter(key: string) {
    const idx = selectedFilters.value.indexOf(key)
    if (idx === -1) selectedFilters.value.push(key)
    else selectedFilters.value.splice(idx, 1)
}

function onNodeSelect(node: DiagramNode) {
    selectedNode.value = node
}

function onDetailClose() {
    selectedNode.value = null
}

function focusSearch() {
    searchInputRef.value?.focus()
}

// 탭 변경 시 노드/필터 리셋
watch(activeTab, () => {
    selectedNode.value = null
    selectedFilters.value = []
    searchQuery.value = ''
})

useKeyboardShortcuts({
    onTabSelect: (tab) => {
        if (tab === activeTab.value) return
        navigateTo(`/admin/diagrams/${tab}`)
    },
    onSearchFocus: focusSearch,
    onHelpToggle: () => {
        helpOpen.value = !helpOpen.value
    }
})
</script>

<template>
    <DashboardShell :meta="activeMeta" :active-tab="activeTab" @open-help="helpOpen = true">
        <template #tabs>
            <DiagramTabs />
        </template>

        <template #sidebar>
            <div class="flex flex-col h-full">
                <div class="px-4 py-3 border-b border-default relative">
                    <DiagramSearch
                        ref="searchInputRef"
                        v-model="searchQuery"
                        aria-label="노드 검색 (단축키: /)"
                    />
                    <span
                        class="flex items-center gap-1 justify-end mt-1 font-mono text-[0.5625rem] text-dimmed"
                        aria-hidden="true"
                    >
                        <UKbd value="/" size="sm" color="neutral" variant="outline" />
                        to focus
                    </span>
                </div>

                <div v-if="legendGroups.length > 0" class="px-4 py-3 border-b border-default">
                    <p
                        class="font-mono text-[0.5625rem] font-semibold text-dimmed uppercase tracking-[0.1em] m-0 mb-2"
                    >
                        Layers
                    </p>
                    <DiagramLegend
                        :groups="legendGroups"
                        :selected="selectedFilters"
                        @toggle="toggleFilter"
                    />
                </div>

                <div class="px-4 py-3 mt-auto">
                    <p
                        class="font-mono text-[0.5625rem] font-semibold text-dimmed uppercase tracking-[0.1em] m-0 mb-2"
                    >
                        Shortcuts
                    </p>
                    <ul
                        class="list-none m-0 p-0 flex flex-col gap-1.5"
                        aria-label="키보드 단축키 목록"
                    >
                        <li class="flex items-center gap-1 text-xs text-muted font-mono">
                            <UKbd value="1" size="sm" color="neutral" variant="outline" />
                            <UKbd value="2" size="sm" color="neutral" variant="outline" />
                            <UKbd value="3" size="sm" color="neutral" variant="outline" />
                            <UKbd value="4" size="sm" color="neutral" variant="outline" />
                            <span class="ml-0.5">탭 전환</span>
                        </li>
                        <li class="flex items-center gap-1 text-xs text-muted font-mono">
                            <UKbd value="/" size="sm" color="neutral" variant="outline" />
                            <span class="ml-0.5">검색 포커스</span>
                        </li>
                        <li class="flex items-center gap-1 text-xs text-muted font-mono">
                            <UKbd value="scroll" size="sm" color="neutral" variant="outline" />
                            <span class="ml-0.5">캔버스 줌</span>
                        </li>
                    </ul>
                </div>
            </div>
        </template>

        <template #canvas>
            <DiagramCanvas
                :src="activeSrc"
                :kind="activeTab"
                :selected-groups="selectedFilters"
                :search-query="searchQuery"
                :aria-label="`${activeTab} 다이어그램 캔버스`"
                @node-select="onNodeSelect"
            />
            <!-- Detail panel overlays canvas on the right -->
            <NodeDetailPanel :node="selectedNode" @close="onDetailClose" />
        </template>

        <template #detail>
            <ShortcutsHelpModal v-model:open="helpOpen" />
        </template>
    </DashboardShell>
</template>
