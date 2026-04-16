<script setup lang="ts">
/** 피드백 패널 — 경로에 달린 피드백 목록 + 공유 링크 + 피드백 추가 버튼 */
const props = defineProps<{
    routeId: string
}>()

const feedbackStore = useFeedbackStore()
const { generateShareLink, formatRelativeTime } = useFeedbackAction()

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
            <h3 class="feedback-panel__title">피드백</h3>
            <span class="feedback-panel__count">{{ feedbackStore.feedbacks.value.length }}개</span>
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

        <!-- 피드백 추가 버튼 -->
        <button
            class="feedback-panel__add-btn"
            :class="{ 'is-active': feedbackStore.isAddingFeedback.value }"
            @click="feedbackStore.toggleAddingMode()"
        >
            <UIcon :name="feedbackStore.isAddingFeedback.value ? 'i-lucide-x' : 'i-lucide-message-circle-plus'" />
            {{ feedbackStore.isAddingFeedback.value ? '취소' : '피드백 추가' }}
        </button>

        <p v-if="feedbackStore.isAddingFeedback.value" class="feedback-panel__hint">
            지도에서 피드백을 남길 위치를 클릭하세요
        </p>

        <!-- 피드백 목록 -->
        <div v-if="feedbackStore.isLoading.value" class="feedback-panel__loading">
            불러오는 중...
        </div>

        <div v-else-if="feedbackStore.feedbacks.value.length === 0" class="feedback-panel__empty">
            아직 피드백이 없습니다.
        </div>

        <ul v-else class="feedback-panel__list">
            <li
                v-for="fb in feedbackStore.feedbacks.value"
                :key="fb.feedbackId"
                class="feedback-panel__item"
                :class="{ 'is-selected': feedbackStore.selectedFeedback.value?.feedbackId === fb.feedbackId }"
                @click="feedbackStore.selectedFeedback.value = fb"
            >
                <div class="feedback-panel__item-header">
                    <span class="feedback-panel__item-author">{{ fb.authorName || '익명' }}</span>
                    <span class="feedback-panel__item-time">{{ fb.createdAt ? formatRelativeTime(fb.createdAt) : '' }}</span>
                </div>
                <p class="feedback-panel__item-content">{{ fb.content }}</p>
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

.feedback-panel__item-author {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text, #fff);
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
