<script setup lang="ts">
/**
 * 단��� 안내 메시지 + 확인 버튼을 제공하는 범용 가이드 모달.
 * 배경 클릭 시에도 닫힌다.
 */
defineProps<{
    open: boolean
    message: string
    confirmLabel?: string
}>()

const emit = defineEmits<{ close: [] }>()
</script>

<template>
    <div v-if="open" class="confirm-guide-modal" @click="emit('close')">
        <div class="confirm-guide-modal__content" @click.stop>
            <p>{{ message }}</p>
            <button class="confirm-guide-modal__btn" @click="emit('close')">
                {{ confirmLabel ?? '확인' }}
            </button>
        </div>
    </div>
</template>

<style scoped>
.confirm-guide-modal {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.5);
}
.confirm-guide-modal__content {
    background: var(--color-surface, #1a1a1a);
    border: 1px solid var(--color-border, #333);
    border-radius: 10px;
    padding: 20px 24px;
    text-align: center;
    max-width: 320px;
    color: var(--color-text, #fff);
    font-size: 14px;
    line-height: 1.5;
}
.confirm-guide-modal__btn {
    margin-top: 12px;
    padding: 8px 24px;
    background: var(--color-primary, #4caf50);
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
}
</style>
