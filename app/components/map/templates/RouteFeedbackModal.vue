<script setup lang="ts">
import Button from '~/components/map/molecules/buttons/Button.vue'
import PopupModal from '~/components/map/templates/PopupModal.vue'

defineProps<{
    open: boolean
    title: string
    message: string
    tone: 'success' | 'error' | 'info'
}>()

defineEmits<{
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
