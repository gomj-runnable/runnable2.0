<script setup lang="ts">
/** 경로정보 입력 폼 — 지도 클릭으로 선택된 위치에 장소명과 설명을 작성한다 */
const props = defineProps<{
    longitude: number
    latitude: number
    elevation?: number
}>()

const emit = defineEmits<{
    submit: [payload: { name: string; description: string }]
    cancel: []
}>()

const name = ref('')
const description = ref('')

const handleSubmit = () => {
    if (!name.value.trim() || !description.value.trim()) return
    emit('submit', {
        name: name.value.trim(),
        description: description.value.trim()
    })
    name.value = ''
    description.value = ''
}
</script>

<template>
    <div class="feedback-input-form">
        <div class="feedback-input-form__header">
            <span class="feedback-input-form__title">경로정보 남기기</span>
            <button class="feedback-input-form__close" @click="emit('cancel')">
                <UIcon name="i-lucide-x" />
            </button>
        </div>
        <div class="feedback-input-form__coord">
            {{ props.longitude.toFixed(5) }}, {{ props.latitude.toFixed(5) }}
        </div>
        <input
            v-model="name"
            class="feedback-input-form__name-input"
            placeholder="장소명"
            maxlength="100"
        />
        <textarea
            v-model="description"
            class="feedback-input-form__textarea"
            placeholder="이 구간에 대한 의견을 남겨주세요"
            maxlength="500"
            rows="3"
        />
        <div class="feedback-input-form__actions">
            <button class="feedback-input-form__btn feedback-input-form__btn--cancel" @click="emit('cancel')">
                취소
            </button>
            <button
                class="feedback-input-form__btn feedback-input-form__btn--submit"
                :disabled="!name.trim() || !description.trim()"
                @click="handleSubmit"
            >
                등록
            </button>
        </div>
    </div>
</template>

<style scoped>
.feedback-input-form {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    background: var(--color-surface, #1a1a1a);
    border-radius: 8px;
    border: 1px solid var(--color-border, #333);
    min-width: 260px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
}

.feedback-input-form__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.feedback-input-form__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text, #fff);
}

.feedback-input-form__close {
    background: none;
    border: none;
    color: var(--color-text-muted, #999);
    cursor: pointer;
    padding: 2px;
}

.feedback-input-form__coord {
    font-size: 11px;
    color: var(--color-text-muted, #888);
}

.feedback-input-form__name-input {
    width: 100%;
    background: var(--color-surface-variant, #222);
    border: 1px solid var(--color-border, #444);
    border-radius: 6px;
    padding: 6px 8px;
    color: var(--color-text, #fff);
    font-size: 13px;
}

.feedback-input-form__textarea {
    width: 100%;
    resize: vertical;
    background: var(--color-surface-variant, #222);
    border: 1px solid var(--color-border, #444);
    border-radius: 6px;
    padding: 8px;
    color: var(--color-text, #fff);
    font-size: 13px;
}

.feedback-input-form__actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
}

.feedback-input-form__btn {
    padding: 6px 14px;
    border-radius: 6px;
    border: none;
    font-size: 13px;
    cursor: pointer;
}

.feedback-input-form__btn--cancel {
    background: var(--color-surface-variant, #333);
    color: var(--color-text-muted, #aaa);
}

.feedback-input-form__btn--submit {
    background: var(--color-primary, #4CAF50);
    color: #fff;
}

.feedback-input-form__btn--submit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>
