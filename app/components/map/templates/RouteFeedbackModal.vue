<script setup lang="ts">
import Button from '~/components/map/molecules/buttons/Button.vue'
import PopupModal from '~/components/map/templates/PopupModal.vue'

defineProps<{
    /** 팝업 표시 여부 */
    open: boolean
    /** 피드백 모달 제목 */
    title: string
    /** 피드백 본문 메시지 */
    message: string
    /** 피드백 색조 (성공/오류/정보) */
    tone: 'success' | 'error' | 'info'
}>()

defineEmits<{
    /** 팝업 열림/닫힘 상태 변경 시 새 상태 값을 전달 */
    'update:open': [value: boolean]
}>()
</script>

<template>
    <PopupModal
        :open="open"
        popup-id="popup-route-feedback"
        aria-labelledby="popup-title-route-feedback"
        panel-class="route-feedback-modal__panel-wrap"
        @update:open="$emit('update:open', $event)"
    >
        <section class="route-feedback-modal" :class="`is-${tone}`">
            <h2 id="popup-title-route-feedback" class="route-feedback-modal__title">{{ title }}</h2>
            <p class="route-feedback-modal__message">{{ message }}</p>
            <div class="route-feedback-modal__actions">
                <Button appearance="prominent" label="확인" @click="$emit('update:open', false)" />
            </div>
        </section>
    </PopupModal>
</template>

<style scoped src="~/assets/css/components/templates/RouteFeedbackModal.css"></style>
