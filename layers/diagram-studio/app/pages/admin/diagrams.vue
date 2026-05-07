<script setup lang="ts">
import { ref, computed } from '#imports'
import type { TabKind } from '../../components/DiagramTabs.vue'
import type { DiagramNode } from '../../../runtime/types'
import { useDiagramData } from '../../composables/useDiagramData'
import { useKeyboardShortcuts } from '../../composables/useKeyboardShortcuts'
import DashboardShell from '../../components/DashboardShell.vue'
import DiagramTabs from '../../components/DiagramTabs.vue'
import DiagramSearch from '../../components/DiagramSearch.vue'
import DiagramLegend from '../../components/DiagramLegend.vue'
import DiagramCanvas from '../../components/DiagramCanvas.vue'
import NodeDetailPanel from '../../components/NodeDetailPanel.vue'

definePageMeta({ ssr: false })

const TAB_SRCS: Record<TabKind, string> = {
    'user-journey': '/diagrams/user-journey.json',
    fsd: '/diagrams/fsd.json',
    composables: '/diagrams/composables.json',
    classes: '/diagrams/classes.json'
}

const activeTab = ref<TabKind>('fsd')
const searchQuery = ref('')
const selectedNode = ref<DiagramNode | null>(null)
const searchInputRef = ref<{ focus: () => void } | null>(null)

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

const GROUP_COLORS: Record<string, string> = {
    widgets: '#00d4a8',
    features: '#ff6b35',
    entities: '#7c6af7',
    shared: '#4a90d9',
    types: '#e8a838',
    schemas: '#64c87a',
    services: '#f06292'
}

const legendGroups = computed(() =>
    activeGroups.value.map((g) => ({
        key: g,
        label: g,
        color: GROUP_COLORS[g] ?? '#4a6580'
    }))
)

const selectedFilters = ref<string[]>([])

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

useKeyboardShortcuts({
    onTabSelect: (tab) => {
        activeTab.value = tab
        selectedNode.value = null
        selectedFilters.value = []
    },
    onSearchFocus: focusSearch
})
</script>

<template>
    <DashboardShell :meta="activeMeta" :active-tab="activeTab">
        <template #tabs>
            <DiagramTabs
                v-model="activeTab"
                @update:model-value="
                    () => {
                        selectedNode = null
                        selectedFilters = []
                    }
                "
            />
        </template>

        <template #sidebar>
            <div class="ds-sidebar">
                <div class="ds-sidebar__section ds-sidebar__search-wrap">
                    <DiagramSearch
                        ref="searchInputRef"
                        v-model="searchQuery"
                        aria-label="노드 검색 (단축키: /)"
                    />
                    <span class="ds-sidebar__shortcut-hint" aria-hidden="true">
                        <UKbd value="/" size="sm" color="neutral" variant="outline" />
                        to focus
                    </span>
                </div>

                <div v-if="legendGroups.length > 0" class="ds-sidebar__section">
                    <p class="ds-sidebar__section-title">Layers</p>
                    <DiagramLegend
                        :groups="legendGroups"
                        :selected="selectedFilters"
                        @toggle="toggleFilter"
                    />
                </div>

                <div class="ds-sidebar__section ds-sidebar__hints">
                    <p class="ds-sidebar__section-title">Shortcuts</p>
                    <ul class="ds-sidebar__hint-list" aria-label="키보드 단축키 목록">
                        <li>
                            <UKbd value="1" size="sm" color="neutral" variant="outline" />
                            <UKbd value="2" size="sm" color="neutral" variant="outline" />
                            <UKbd value="3" size="sm" color="neutral" variant="outline" />
                            <UKbd value="4" size="sm" color="neutral" variant="outline" />
                            <span>탭 전환</span>
                        </li>
                        <li>
                            <UKbd value="/" size="sm" color="neutral" variant="outline" />
                            <span>검색 포커스</span>
                        </li>
                        <li>
                            <UKbd value="scroll" size="sm" color="neutral" variant="outline" />
                            <span>캔버스 줌</span>
                        </li>
                    </ul>
                </div>
            </div>
        </template>

        <template #canvas>
            <DiagramCanvas
                :src="activeSrc"
                :aria-label="`${activeTab} 다이어그램 캔버스`"
                @node-select="onNodeSelect"
            />
            <!-- Detail panel overlays canvas on the right -->
            <NodeDetailPanel :node="selectedNode" @close="onDetailClose" />
        </template>

        <template #detail />
    </DashboardShell>
</template>

<style scoped>
.ds-sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.ds-sidebar__section {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--ds-border);
}

.ds-sidebar__search-wrap {
    position: relative;
}

.ds-sidebar__shortcut-hint {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    justify-content: flex-end;
    margin-top: 0.25rem;
    font-family: var(--ds-font-mono);
    font-size: 0.5625rem;
    color: var(--ds-text-dim);
}

.ds-sidebar__section-title {
    font-family: var(--ds-font-mono);
    font-size: 0.5625rem;
    font-weight: 600;
    color: var(--ds-text-dim);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin: 0 0 0.5rem 0;
}

.ds-sidebar__hints {
    margin-top: auto;
}

.ds-sidebar__hint-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
}

.ds-sidebar__hint-list li {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: var(--ds-text-muted);
    font-family: var(--ds-font-mono);
}

.ds-sidebar__hint-list span {
    margin-left: 0.125rem;
    color: var(--ds-text-muted);
}
</style>
