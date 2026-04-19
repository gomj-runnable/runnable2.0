<script setup lang="ts">
import { useRouteInfoStore } from '~/composables/store/useRouteInfoStore'
import { useRouteInfoAction } from '~/composables/action/useRouteInfoAction'
/** 경로정보 패널 — 경로에 달린 경로정보 목록 + 공유 링크 + 경로정보 추가 버튼 */
const props = defineProps<{
    routeId: string
}>()

const routeInfoStore = useRouteInfoStore()
const { generateShareLink, formatRelativeTime } = useRouteInfoAction()

const shareLink = computed(() => generateShareLink(props.routeId))
const isCopied = ref(false)

const copyShareLink = async () => {
    try {
        await navigator.clipboard.writeText(shareLink.value)
        isCopied.value = true
        setTimeout(() => { isCopied.value = false }, 2000)
    } catch {
        // fallback
    }
}
</script>

<template>
    <div class="feedback-panel">
        <div class="feedback-panel__header">
            <h3 class="feedback-panel__title">경로정보</h3>
            <span class="feedback-panel__count">{{ routeInfoStore.routeInfos.value.length }}개</span>
        </div>

        <!-- 공유 링크 -->
        <div class="feedback-panel__share">
            <input
                :value="shareLink"
                readonly
                class="feedback-panel__share-input"
            />
            <button class="feedback-panel__share-btn" @click="copyShareLink">
                {{ isCopied ? '복사됨' : '복사' }}
            </button>
        </div>

        <!-- 경로정보 추가 버튼 -->
        <button
            class="feedback-panel__add-btn"
            :class="{ 'is-active': routeInfoStore.isAddingRouteInfo.value }"
            @click="routeInfoStore.toggleAddingMode()"
        >
            <UIcon :name="routeInfoStore.isAddingRouteInfo.value ? 'i-lucide-x' : 'i-lucide-message-circle-plus'" />
            {{ routeInfoStore.isAddingRouteInfo.value ? '취소' : '경로정보 추가' }}
        </button>

        <p v-if="routeInfoStore.isAddingRouteInfo.value" class="feedback-panel__hint">
            지도에서 경로정보를 남길 위치를 클릭하세요
        </p>

        <!-- 경로정보 목록 -->
        <div v-if="routeInfoStore.isLoading.value" class="feedback-panel__loading">
            불러오는 중...
        </div>

        <div v-else-if="routeInfoStore.routeInfos.value.length === 0" class="feedback-panel__empty">
            아직 경로정보가 없습니다.
        </div>

        <ul v-else class="feedback-panel__list">
            <li
                v-for="item in routeInfoStore.routeInfos.value"
                :key="item.routeInfoId"
                class="feedback-panel__item"
                :class="{ 'is-selected': 'routeInfoId' in (routeInfoStore.selectedMarkerRouteInfo.value ?? {}) && (routeInfoStore.selectedMarkerRouteInfo.value as any)?.routeInfoId === item.routeInfoId }"
                @click="routeInfoStore.selectedMarkerRouteInfo.value = item"
            >
                <div class="feedback-panel__item-header">
                    <span class="feedback-panel__item-name">{{ item.name }}</span>
                    <span class="feedback-panel__item-time">{{ item.createdAt ? formatRelativeTime(item.createdAt) : '' }}</span>
                </div>
                <p class="feedback-panel__item-content">{{ item.description }}</p>
                <span class="feedback-panel__item-author">{{ item.authorName }}</span>
            </li>
        </ul>
    </div>
</template>

<style scoped>
.feedback-panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
}

.feedback-panel__header {
    display: flex;
    align-items: center;
    gap: 8px;
}

.feedback-panel__title {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text, #fff);
    margin: 0;
}

.feedback-panel__count {
    font-size: 12px;
    color: var(--color-text-muted, #888);
    background: var(--color-surface-variant, #333);
    padding: 2px 8px;
    border-radius: 10px;
}

.feedback-panel__share {
    display: flex;
    gap: 6px;
}

.feedback-panel__share-input {
    flex: 1;
    background: var(--color-surface-variant, #222);
    border: 1px solid var(--color-border, #444);
    border-radius: 6px;
    padding: 6px 8px;
    color: var(--color-text-muted, #aaa);
    font-size: 12px;
}

.feedback-panel__share-btn {
    padding: 6px 12px;
    background: var(--color-primary, #4CAF50);
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    white-space: nowrap;
}

.feedback-panel__add-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: var(--color-surface-variant, #2a2a2a);
    border: 1px solid var(--color-border, #444);
    border-radius: 8px;
    color: var(--color-text, #fff);
    font-size: 13px;
    cursor: pointer;
}

.feedback-panel__add-btn.is-active {
    background: var(--color-primary, #4CAF50);
    border-color: var(--color-primary, #4CAF50);
}

.feedback-panel__hint {
    font-size: 12px;
    color: var(--color-primary, #4CAF50);
    margin: 0;
}

.feedback-panel__loading,
.feedback-panel__empty {
    font-size: 13px;
    color: var(--color-text-muted, #888);
    text-align: center;
    padding: 16px 0;
}

.feedback-panel__list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 300px;
    overflow-y: auto;
}

.feedback-panel__item {
    padding: 8px 10px;
    background: var(--color-surface-variant, #222);
    border-radius: 8px;
    cursor: pointer;
    border: 1px solid transparent;
}

.feedback-panel__item.is-selected {
    border-color: var(--color-primary, #4CAF50);
}

.feedback-panel__item-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
}

.feedback-panel__item-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text, #fff);
}

.feedback-panel__item-author {
    font-size: 11px;
    color: var(--color-text-muted, #888);
}

.feedback-panel__item-time {
    font-size: 11px;
    color: var(--color-text-muted, #888);
}

.feedback-panel__item-content {
    font-size: 13px;
    color: var(--color-text, #ddd);
    margin: 0;
    line-height: 1.4;
}
</style>
