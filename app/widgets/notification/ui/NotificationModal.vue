<script setup lang="ts">
/**
 * 앱 전역 알림 모달.
 * `useNotificationStore`의 상태를 구독하여 알림을 표시한다.
 * 페이지 루트에 한 번만 마운트하면 어디서든 `notify()`로 호출 가능하다.
 */
import { useNotificationStore } from '~/entities/notification/model/useNotificationStore'

const notification = useNotificationStore()
</script>

<template>
    <UModal
        :open="notification.isOpen.value"
        @update:open="notification.close()"
    >
        <section class="notification-modal" :class="`is-${notification.tone.value}`">
            <div class="notification-modal__header">
                <UIcon :name="notification.tone.value.icon" class="notification-modal__icon" />
                <h2 id="popup-title-notification" class="notification-modal__title">
                    {{ notification.title.value }}
                </h2>
            </div>
            <p class="notification-modal__message">{{ notification.message.value }}</p>
            <div class="notification-modal__actions">
                <UButton variant="solid" color="primary" label="확인" @click="notification.close()" />
            </div>
        </section>
    </UModal>
</template>

<style scoped src="./NotificationModal.css"></style>
