<script setup lang="ts">
import Button from '~/components/map/molecules/buttons/Button.vue'
import PopupModal from '~/components/map/templates/PopupModal.vue'

defineProps<{
    /** 팝업 표시 여부 */
    open: boolean
    /** 경로정보 모달 제목 */
    title: string
    /** 경로정보 본문 메시지 */
    message: string
    /** 경로정보 색조 (성공/오류/정보) */
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
        popup-id="popup-route-info"
        aria-labelledby="popup-title-route-info"
        panel-class="route-info-modal__panel-wrap"
        @update:open="$emit('update:open', $event)"
    >
        <section class="route-info-modal" :class="`is-${tone}`">
            <h2 id="popup-title-route-info" class="route-info-modal__title">{{ title }}</h2>
            <p class="route-info-modal__message">{{ message }}</p>
            <div class="route-info-modal__actions">
                <Button appearance="prominent" label="확인" @click="$emit('update:open', false)" />
            </div>
        </section>
    </PopupModal>
</template>

<style scoped src="~/assets/css/components/templates/RouteInfoModal.css"></style>
