<script setup lang="ts">
/**
 * 공유 경로 페이지 — 인증 없이 접근 가능한 경로 공유 뷰.
 * 3D 지도 위에 경로와 경로정보 마커를 표시하고 경로정보를 남길 수 있다.
 */
import type { SavedRoute, SavedSection } from '#shared/types/route'

definePageMeta({ ssr: false, layout: 'default' })

const route = useRoute()
const routeId = route.params.routeId as string

const sharedData = ref<{
    route: SavedRoute
    sections: SavedSection[]
    routeInfos: Array<Record<string, unknown>>
} | null>(null)
const error = ref<string | null>(null)
const isLoading = ref(true)

onMounted(async () => {
    try {
        const data = await $fetch(`/api/routes/share/${routeId}`)
        sharedData.value = data as typeof sharedData.value
    } catch (e: unknown) {
        error.value = '경로를 불러올 수 없습니다.'
        console.error('[SharePage]', e)
    } finally {
        isLoading.value = false
    }
})
</script>

<template>
    <div
        class="w-full h-screen flex flex-col bg-[var(--color-bg,#111)] text-[var(--color-text,#fff)]"
    >
        <div
            v-if="isLoading"
            class="flex items-center justify-center h-full text-base text-[var(--color-text-muted,#888)]"
        >
            경로를 불러오는 중...
        </div>

        <div
            v-else-if="error"
            class="flex items-center justify-center h-full text-base text-[var(--color-text-muted,#888)]"
        >
            {{ error }}
        </div>

        <div v-else-if="sharedData" class="flex flex-col h-full">
            <div class="px-5 py-4 border-b border-[var(--color-border,#333)]">
                <h1 class="text-xl font-bold m-0 mb-1">{{ sharedData.route.title }}</h1>
                <p
                    v-if="sharedData.route.description"
                    class="text-sm text-[var(--color-text-muted,#aaa)] m-0"
                >
                    {{ sharedData.route.description }}
                </p>
            </div>

            <div class="flex gap-4 px-5 py-2 text-[13px] text-[var(--color-text-muted,#aaa)]">
                <span v-if="sharedData.route?.distance">
                    거리: {{ (Number(sharedData.route.distance) / 1000).toFixed(2) }}km
                </span>
                <span>경로정보 {{ sharedData.routeInfos.length }}개</span>
            </div>

            <!-- TODO: 3D 지도 뷰어 + 경로정보 마커 렌더링 -->
            <div
                class="flex-1 flex items-center justify-center text-sm text-[var(--color-text-muted,#666)] bg-[var(--color-surface,#1a1a1a)]"
            >
                3D 지도 뷰어 영역 (Phase 2에서 구현)
            </div>
        </div>
    </div>
</template>
