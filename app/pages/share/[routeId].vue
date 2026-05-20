<script setup lang="ts">
/**
 * 공유 경로 페이지 — 인증 없이 접근 가능한 경로 공유 뷰.
 * 3D 지도 위에 경로 폴리라인을 렌더링하고 경로 메타 정보를 표시한다.
 */
import type { SavedRoute, SavedSection } from '#shared/types/route'
import type { CesiumViewer } from '~/shared/lib/useWindow'
import { useMapInit } from '~/shared/lib/map/useMapInit'
import { useShareViewerSideeffect } from '~/features/share-viewer/api/useShareViewerSideeffect'

definePageMeta({ ssr: false, layout: 'default' })

useHead({
    link: [{ rel: 'stylesheet', href: '/lib/cesium/Widgets/widgets.css' }]
})

const route = useRoute()
const routeId = route.params.routeId as string

const sharedData = ref<{
    route: SavedRoute
    sections: SavedSection[]
    routeInfos: Array<Record<string, unknown>>
} | null>(null)
const error = ref<string | null>(null)
const isLoading = ref(true)

const viewer = shallowRef<CesiumViewer | null>(null)
const { init } = useMapInit()
const shareViewer = useShareViewerSideeffect({ viewer })

async function loadShare() {
    isLoading.value = true
    error.value = null
    try {
        const data = await $fetch(`/api/routes/share/${routeId}`)
        sharedData.value = data as typeof sharedData.value
    } catch (e: unknown) {
        error.value = '경로를 불러올 수 없습니다.'
        console.error('[SharePage]', e)
    } finally {
        isLoading.value = false
    }
}

async function retry() {
    await loadShare()
    if (sharedData.value && viewer.value) {
        shareViewer.renderSections(sharedData.value.sections)
    }
}

onMounted(async () => {
    await loadShare()
    await init()
    viewer.value = (window as Window & { viewer?: CesiumViewer }).viewer ?? null

    if (sharedData.value && viewer.value) {
        shareViewer.renderSections(sharedData.value.sections)
    }
})

onUnmounted(() => {
    shareViewer.clear()
})

const distanceKm = computed(() => {
    const d = sharedData.value?.route.distance
    return d ? (Number(d) / 1000).toFixed(2) : null
})

const elevationRange = computed(() => {
    const r = sharedData.value?.route
    if (!r?.highHeight || !r?.lowHeight) return null
    return `${Math.round(Number(r.lowHeight))}m ~ ${Math.round(Number(r.highHeight))}m`
})
</script>

<template>
    <div class="relative w-full h-screen overflow-hidden bg-[#111]">
        <!-- Cesium 지도 컨테이너 -->
        <div id="map" class="absolute inset-0" />

        <!-- 로딩 -->
        <div
            v-if="isLoading"
            class="absolute inset-0 flex items-center justify-center text-base text-[var(--color-text-muted,#888)] z-10"
        >
            경로를 불러오는 중...
        </div>

        <!-- 오류 -->
        <div
            v-else-if="error"
            class="absolute inset-0 flex items-center justify-center z-10 px-4"
        >
            <div
                class="rounded-xl bg-black/70 backdrop-blur-sm px-6 py-5 text-white text-center max-w-sm"
            >
                <UIcon
                    name="i-lucide-circle-alert"
                    class="w-10 h-10 mx-auto mb-3 text-red-400"
                />
                <p class="text-base font-medium">{{ error }}</p>
                <p class="text-xs text-gray-400 mt-2">잠시 후 다시 시도해주세요.</p>
                <div class="mt-4 flex items-center justify-center gap-2">
                    <UButton
                        label="다시 시도"
                        icon="i-lucide-rotate-cw"
                        size="sm"
                        color="neutral"
                        variant="outline"
                        @click="retry"
                    />
                    <UButton
                        label="홈으로"
                        to="/"
                        size="sm"
                        color="neutral"
                        variant="ghost"
                    />
                </div>
            </div>
        </div>

        <!-- 경로 정보 오버레이 -->
        <div
            v-else-if="sharedData"
            class="absolute top-4 left-4 z-10 max-w-xs rounded-xl bg-black/70 backdrop-blur-sm px-4 py-3 text-white shadow-lg"
        >
            <h1 class="text-base font-bold leading-tight mb-1">{{ sharedData.route.title }}</h1>
            <p v-if="sharedData.route.description" class="text-xs text-gray-300 mb-2 line-clamp-2">
                {{ sharedData.route.description }}
            </p>
            <div class="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400">
                <span v-if="distanceKm">거리 {{ distanceKm }} km</span>
                <span v-if="elevationRange">고도 {{ elevationRange }}</span>
                <span v-if="sharedData.route.authorName">by {{ sharedData.route.authorName }}</span>
                <span>경로정보 {{ sharedData.routeInfos.length }}개</span>
            </div>
        </div>
    </div>
</template>
