<script setup lang="ts">
/** 경로정보 마커 클릭 시 표시되는 오버레이 팝업 */
defineProps<{
    name: string
    description: string
    authorName?: string
}>()

defineEmits<{
    close: []
}>()
</script>

<template>
    <div class="feedback-marker-popup">
        <div class="feedback-marker-popup__header">
            <span class="feedback-marker-popup__name">{{ name }}</span>
            <button class="feedback-marker-popup__close" @click="$emit('close')">
                <UIcon name="i-lucide-x" />
            </button>
        </div>
        <p class="feedback-marker-popup__description">{{ description }}</p>
        <span v-if="authorName" class="feedback-marker-popup__author">{{ authorName }}</span>
    </div>
</template>

<style scoped>
.feedback-marker-popup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px;
    background: var(--color-surface, #1a1a1a);
    border-radius: 8px;
    border: 1px solid var(--color-border, #333);
    min-width: 220px;
    max-width: 320px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
}

.feedback-marker-popup__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.feedback-marker-popup__name {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text, #fff);
}

.feedback-marker-popup__close {
    background: none;
    border: none;
    color: var(--color-text-muted, #999);
    cursor: pointer;
    padding: 2px;
}

.feedback-marker-popup__description {
    font-size: 13px;
    color: var(--color-text, #ddd);
    margin: 0;
    line-height: 1.4;
    word-break: break-word;
}

.feedback-marker-popup__author {
    font-size: 11px;
    color: var(--color-text-muted, #888);
}
</style>
