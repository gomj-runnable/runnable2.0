<script setup lang="ts">
/**
 * 공유 경로 페이지 — 인증 없이 접근 가능한 경로 공유 뷰.
 * 3D 지도 위에 경로와 경로정보 마커를 표시하고 경로정보를 남길 수 있다.
 */
definePageMeta({ ssr: false, layout: 'default' })

const route = useRoute()
const routeId = route.params.routeId as string

const sharedData = ref<{
    route: Record<string, unknown>
    sections: Array<Record<string, unknown>>
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
    <div class="share-page">
        <div v-if="isLoading" class="share-page__loading">
            경로를 불러오는 중...
        </div>

        <div v-else-if="error" class="share-page__error">
            {{ error }}
        </div>

        <div v-else-if="sharedData" class="share-page__content">
            <div class="share-page__header">
                <h1 class="share-page__title">{{ (sharedData.route as Record<string, string>).title }}</h1>
                <p v-if="(sharedData.route as Record<string, string>).description" class="share-page__desc">
                    {{ (sharedData.route as Record<string, string>).description }}
                </p>
            </div>

            <div class="share-page__info">
                <span v-if="sharedData.route?.['distance']">
                    거리: {{ (Number(sharedData.route['distance']) / 1000).toFixed(2) }}km
                </span>
                <span>경로정보 {{ sharedData.routeInfos.length }}개</span>
            </div>

            <!-- TODO: 3D 지도 뷰어 + 경로정보 마커 렌더링 -->
            <div class="share-page__map-placeholder">
                3D 지도 뷰어 영역 (Phase 2에서 구현)
            </div>
        </div>
    </div>
</template>

<style scoped>
.share-page {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--color-bg, #111);
    color: var(--color-text, #fff);
}

.share-page__loading,
.share-page__error {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    font-size: 16px;
    color: var(--color-text-muted, #888);
}

.share-page__content {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.share-page__header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--color-border, #333);
}

.share-page__title {
    font-size: 20px;
    font-weight: 700;
    margin: 0 0 4px;
}

.share-page__desc {
    font-size: 14px;
    color: var(--color-text-muted, #aaa);
    margin: 0;
}

.share-page__info {
    display: flex;
    gap: 16px;
    padding: 8px 20px;
    font-size: 13px;
    color: var(--color-text-muted, #aaa);
}

.share-page__map-placeholder {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: var(--color-text-muted, #666);
    background: var(--color-surface, #1a1a1a);
}
</style>
