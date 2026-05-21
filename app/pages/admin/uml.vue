<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import VueMermaidString from 'vue-mermaid-string'
import type {
    AnalyzeResponseItem,
    DiagramType,
    DomainTab,
    Feature,
    FeaturesPayload
} from '~~/shared/types/uml'

definePageMeta({
    ssr: false
})

const colorMode = useColorMode()

const domain = useState<DomainTab>('uml:domain', () => 'frontend')
const diagramType = useState<DiagramType>('uml:diagramType', () => 'flowchart')
const activeMap = useState<Record<DomainTab, string[]>>('uml:active', () => ({
    planning: [],
    frontend: [],
    backend: [],
    library: []
}))
const search = useState<string>('uml:search', () => '')

if (import.meta.client) {
    const saved = window.localStorage.getItem('uml:active')
    if (saved) {
        try {
            const parsed = JSON.parse(saved) as Partial<Record<DomainTab, string[]>>
            activeMap.value = {
                planning: parsed.planning ?? [],
                frontend: parsed.frontend ?? [],
                backend: parsed.backend ?? [],
                library: parsed.library ?? []
            }
        } catch {
            /* ignore */
        }
    }
    watch(
        activeMap,
        (val) => {
            window.localStorage.setItem('uml:active', JSON.stringify(val))
        },
        { deep: true }
    )
}

const {
    data: featuresData,
    pending: featuresLoading,
    refresh: refreshFeatures
} = await useFetch<FeaturesPayload>('/api/uml/features')

const visibleFeatures = computed<Feature[]>(() => {
    const all = featuresData.value?.features ?? []
    const inDomain = all.filter((f) => f.domain === domain.value)
    const q = search.value.trim().toLowerCase()
    return q
        ? inDomain.filter((f) => f.name.toLowerCase().includes(q) || f.id.toLowerCase().includes(q))
        : inDomain
})

// detect 실패(도메인 0건) 여부 — 검색 미일치(>0)와 빈 상태 UX 구분에 사용.
const inDomainCount = computed(
    () => (featuresData.value?.features ?? []).filter((f) => f.domain === domain.value).length
)

const activeIds = computed(() => activeMap.value[domain.value] ?? [])
const activeFeatures = computed<Feature[]>(() => {
    const all = featuresData.value?.features ?? []
    const set = new Set(activeIds.value)
    return all.filter((f) => f.domain === domain.value && set.has(f.id))
})

function toggleFeature(id: string, on: boolean) {
    const current = activeMap.value[domain.value] ?? []
    activeMap.value = {
        ...activeMap.value,
        [domain.value]: on ? [...new Set([...current, id])] : current.filter((x) => x !== id)
    }
}

function selectAll() {
    activeMap.value = {
        ...activeMap.value,
        [domain.value]: visibleFeatures.value.map((f) => f.id)
    }
}

function deselectAll() {
    activeMap.value = { ...activeMap.value, [domain.value]: [] }
}

async function rescan() {
    await $fetch('/api/uml/features/rescan', { method: 'POST' })
    await refreshFeatures()
}

const diagramTypeOptions = computed(() => {
    if (domain.value === 'planning') {
        return [{ label: 'Flowchart (자리만 마련)', value: 'flowchart' as DiagramType }]
    }
    if (domain.value === 'frontend') {
        return [
            { label: 'Flowchart (import 그래프)', value: 'flowchart' as DiagramType },
            { label: 'Class (컴포넌트 인터페이스)', value: 'class' as DiagramType }
        ]
    }
    if (domain.value === 'backend') {
        return [
            { label: 'Class (핸들러/서비스)', value: 'class' as DiagramType },
            { label: 'Sequence (호출 흐름)', value: 'sequence' as DiagramType }
        ]
    }
    return [
        { label: 'Flowchart (모듈 그래프)', value: 'flowchart' as DiagramType },
        { label: 'Dependency (package.json)', value: 'dependency' as DiagramType }
    ]
})

watch(domain, () => {
    const allowed = diagramTypeOptions.value.map((o) => o.value)
    if (!allowed.includes(diagramType.value) && allowed[0]) {
        diagramType.value = allowed[0]
    }
})

const tabItems = [
    { label: '기획', value: 'planning' as DomainTab, icon: 'i-lucide-clipboard-list' },
    { label: '프론트', value: 'frontend' as DomainTab, icon: 'i-lucide-layout-template' },
    { label: '백', value: 'backend' as DomainTab, icon: 'i-lucide-server' },
    { label: '라이브러리', value: 'library' as DomainTab, icon: 'i-lucide-package' }
]

const DOMAIN_ICONS: Record<DomainTab, string> = {
    planning: 'i-lucide-clipboard-list',
    frontend: 'i-lucide-layout-template',
    backend: 'i-lucide-server',
    library: 'i-lucide-package'
}

const results = ref<AnalyzeResponseItem[]>([])
const analyzing = ref(false)
const analyzeError = ref<string | null>(null)
const lastAnalyzedAt = ref<string | null>(null)

async function runAnalysis() {
    analyzeError.value = null
    if (activeIds.value.length === 0) {
        results.value = []
        return
    }
    analyzing.value = true
    try {
        const res = await $fetch<AnalyzeResponseItem[]>('/api/uml/analyze', {
            method: 'POST',
            body: {
                domain: domain.value,
                featureIds: activeIds.value,
                diagramType: diagramType.value
            }
        })
        results.value = res
        lastAnalyzedAt.value = new Date().toISOString()
    } catch (e) {
        analyzeError.value = e instanceof Error ? e.message : String(e)
    } finally {
        analyzing.value = false
    }
}

const totalFileCount = computed(() => activeFeatures.value.reduce((a, f) => a + f.fileCount, 0))

const mermaidTheme = computed(() => (colorMode.value === 'dark' ? 'dark' : 'default'))

function resultFor(id: string): AnalyzeResponseItem | undefined {
    return results.value.find((r) => r.featureId === id)
}

// 카드 클릭 → 확대 모달
const expandedFeatureId = ref<string | null>(null)
const expandedFeature = computed<Feature | undefined>(() =>
    activeFeatures.value.find((f) => f.id === expandedFeatureId.value)
)
const expandedMermaid = computed<string | undefined>(() => {
    if (!expandedFeatureId.value) return undefined
    return resultFor(expandedFeatureId.value)?.mermaid
})

function withTheme(src: string, theme: string): string {
    if (src.startsWith('%%{init')) return src
    return `%%{init: { 'theme': '${theme}' }}%%\n${src}`
}
</script>

<template>
    <UDashboardGroup>
        <UDashboardSidebar collapsible :ui="{ root: 'w-72' }">
            <template #header>
                <div class="font-semibold text-sm">UML Features</div>
            </template>

            <template #default>
                <div class="flex flex-col gap-2 px-2 pt-2">
                    <UInput v-model="search" placeholder="검색…" icon="i-lucide-search" size="sm" />
                    <div class="flex gap-2">
                        <UButton
                            size="xs"
                            variant="soft"
                            icon="i-lucide-check-check"
                            block
                            @click="selectAll"
                        >
                            전체 선택
                        </UButton>
                        <UButton
                            size="xs"
                            variant="soft"
                            color="neutral"
                            icon="i-lucide-x"
                            block
                            @click="deselectAll"
                        >
                            해제
                        </UButton>
                    </div>
                    <UButton
                        size="xs"
                        variant="outline"
                        icon="i-lucide-refresh-cw"
                        :loading="featuresLoading"
                        block
                        @click="rescan"
                    >
                        재스캔
                    </UButton>
                </div>

                <USeparator class="my-2" />

                <div v-if="featuresLoading" class="flex flex-col gap-2 px-2">
                    <USkeleton v-for="i in 5" :key="i" class="h-8 w-full" />
                </div>
                <div v-else class="flex flex-col gap-1 px-2 pb-4">
                    <div v-if="visibleFeatures.length === 0" class="px-2 py-4 flex flex-col gap-2">
                        <template v-if="inDomainCount === 0">
                            <div class="text-xs text-(--ui-text-muted)">
                                감지된 Feature 가 없습니다. 재스캔을 시도해보세요.
                            </div>
                            <div class="text-[11px] text-(--ui-text-muted) leading-snug">
                                prod 빌드에서 캐시가 비어있다면
                                <code>.omc/uml-cache/features.json</code> 을 삭제 후 재스캔하세요.
                            </div>
                            <UButton
                                size="xs"
                                variant="soft"
                                icon="i-lucide-refresh-cw"
                                :loading="featuresLoading"
                                @click="rescan"
                            >
                                재스캔
                            </UButton>
                        </template>
                        <div v-else class="text-xs text-(--ui-text-muted)">
                            "{{ search }}" 검색 결과가 없습니다. 검색어를 변경해보세요.
                        </div>
                    </div>
                    <label
                        v-for="f in visibleFeatures"
                        :key="f.id"
                        class="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-(--ui-bg-elevated) cursor-pointer"
                    >
                        <UCheckbox
                            :model-value="activeIds.includes(f.id)"
                            @update:model-value="
                                (v: boolean | 'indeterminate') => toggleFeature(f.id, v === true)
                            "
                        />
                        <span class="text-sm flex-1 truncate" :title="f.id">{{ f.name }}</span>
                        <UBadge color="neutral" variant="subtle" size="xs">{{
                            f.fileCount
                        }}</UBadge>
                    </label>
                </div>
            </template>
        </UDashboardSidebar>

        <UDashboardPanel>
            <UDashboardNavbar title="UML Dashboard" icon="i-lucide-git-graph">
                <template #right>
                    <UBadge color="info" variant="subtle" size="sm">개발 전용</UBadge>
                </template>
            </UDashboardNavbar>

            <UTabs v-model="domain" :items="tabItems" value-key="value" class="px-4 pt-4" />

            <div class="px-4 py-4 flex flex-col gap-4">
                <UCard>
                    <div class="flex items-end gap-3 flex-wrap">
                        <UFormField label="다이어그램 종류" class="min-w-56">
                            <USelect
                                v-model="diagramType"
                                :items="diagramTypeOptions"
                                value-key="value"
                            />
                        </UFormField>
                        <UButton
                            icon="i-lucide-play"
                            :loading="analyzing"
                            :disabled="activeIds.length === 0"
                            @click="runAnalysis"
                        >
                            분석 실행
                        </UButton>
                        <div class="ml-auto flex items-center gap-2 text-xs text-(--ui-text-muted)">
                            <UBadge variant="subtle" color="neutral"
                                >활성 {{ activeIds.length }}</UBadge
                            >
                            <UBadge variant="subtle" color="neutral"
                                >총 파일 {{ totalFileCount }}</UBadge
                            >
                            <UBadge v-if="lastAnalyzedAt" variant="subtle" color="neutral">
                                {{ new Date(lastAnalyzedAt).toLocaleTimeString() }}
                            </UBadge>
                        </div>
                    </div>
                </UCard>

                <UAlert
                    v-if="analyzeError"
                    icon="i-lucide-alert-triangle"
                    color="error"
                    variant="subtle"
                    title="분석 실패"
                    :description="analyzeError"
                />

                <UCard v-if="activeIds.length === 0" class="text-center py-12">
                    <UIcon
                        name="i-lucide-list-checks"
                        class="w-10 h-10 mx-auto mb-2 text-(--ui-text-muted)"
                    />
                    <div class="font-medium">활성 Feature 가 없습니다</div>
                    <div class="text-sm text-(--ui-text-muted) mt-1">
                        왼쪽 사이드 패널에서 Feature 를 토글하고 "분석 실행"을 눌러주세요.
                    </div>
                </UCard>

                <div v-else class="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <UCard
                        v-for="f in activeFeatures"
                        :key="f.id"
                        :class="
                            resultFor(f.id)
                                ? 'cursor-zoom-in hover:ring-2 hover:ring-(--ui-primary)/40 transition-shadow'
                                : ''
                        "
                        @click="resultFor(f.id) && (expandedFeatureId = f.id)"
                    >
                        <template #header>
                            <div class="flex items-center gap-2">
                                <UIcon :name="DOMAIN_ICONS[f.domain]" class="w-4 h-4" />
                                <h3 class="font-medium text-sm truncate" :title="f.id">
                                    {{ f.name }}
                                </h3>
                                <UBadge color="neutral" variant="subtle" size="xs" class="ml-auto">
                                    {{ f.fileCount }} files
                                </UBadge>
                            </div>
                        </template>

                        <div class="uml-diagram-container overflow-auto">
                            <USkeleton v-if="analyzing" class="h-48 w-full" />
                            <ClientOnly v-else>
                                <template #fallback>
                                    <USkeleton class="h-48 w-full" />
                                </template>
                                <VueMermaidString
                                    v-if="resultFor(f.id)"
                                    :value="withTheme(resultFor(f.id)!.mermaid, mermaidTheme)"
                                />
                                <div v-else class="text-xs text-(--ui-text-muted) py-6 text-center">
                                    "분석 실행"을 눌러 다이어그램을 생성하세요.
                                </div>
                            </ClientOnly>
                        </div>

                        <template #footer>
                            <div class="text-xs text-(--ui-text-muted)">
                                {{ f.paths.join(', ') }}
                            </div>
                        </template>
                    </UCard>
                </div>
            </div>
        </UDashboardPanel>

        <UModal
            :open="expandedFeatureId !== null"
            :title="expandedFeature?.name ?? ''"
            :description="expandedFeature?.paths.join(', ') ?? ''"
            :ui="{ content: 'max-w-[95vw] sm:max-w-5xl', body: 'p-4 sm:p-6' }"
            @update:open="
                (v: boolean) => {
                    if (!v) expandedFeatureId = null
                }
            "
        >
            <template #body>
                <div class="uml-diagram-container-expanded overflow-auto">
                    <ClientOnly>
                        <VueMermaidString
                            v-if="expandedMermaid"
                            :value="withTheme(expandedMermaid, mermaidTheme)"
                        />
                    </ClientOnly>
                </div>
            </template>
        </UModal>
    </UDashboardGroup>
</template>

<style scoped>
.uml-diagram-container :deep(svg) {
    max-width: 100%;
    height: auto;
}
/* 확대 모달은 svg 자체를 크게 — 가로 100% 까지 확장, 세로는 viewport 80%까지 */
.uml-diagram-container-expanded :deep(svg) {
    width: 100%;
    height: auto;
    max-height: 80vh;
}
</style>
