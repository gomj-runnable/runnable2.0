<script setup lang="ts">
import Button from '~/components/map/molecules/buttons/Button.vue'
import Textfield from '~/components/map/atoms/inputs/Textfield.vue'

defineProps<{
    open: boolean
    title: string
    description: string
    distance?: number
}>()

defineEmits<{
    'update:open': [value: boolean]
    'update:title': [value: string]
    'update:description': [value: string]
    submit: []
}>()

const formatDistance = (distance?: number) => {
    if (typeof distance !== 'number' || Number.isNaN(distance)) {
        return ''
    }

    return distance.toFixed(2)
}
</script>

<template>
    <UModal
        :open="open"
        :dismissible="true"
        :overlay="true"
        @update:open="$emit('update:open', $event)"
    >
        <template #content>
            <div class="route-save-modal">
                <div class="route-save-modal__header">
                    <div class="route-save-modal__eyebrow">경로 저장</div>
                    <h2 class="route-save-modal__title">경로 정보를 입력하세요</h2>
                </div>

                <div class="route-save-modal__fields">
                    <label class="route-save-modal__field map-form-field">
                        <span class="map-form-label">제목</span>
                        <Textfield
                            :model-value="title"
                            placeholder="경로 제목"
                            @update:model-value="$emit('update:title', $event)"
                        />
                    </label>

                    <label class="route-save-modal__field map-form-field">
                        <span class="map-form-label">설명</span>
                        <textarea
                            :value="description"
                            rows="4"
                            class="map-form-control"
                            placeholder="경로 설명"
                            @input="
                                $emit(
                                    'update:description',
                                    ($event.target as HTMLTextAreaElement).value
                                )
                            "
                        />
                    </label>

                    <label class="route-save-modal__field map-form-field">
                        <span class="map-form-label">거리</span>
                        <Textfield
                            :model-value="formatDistance(distance)"
                            placeholder="0.00"
                            disabled
                        />
                    </label>
                </div>

                <div class="route-save-modal__actions">
                    <Button
                        appearance="secondary"
                        role="cancel"
                        class="route-save-modal__button"
                        label="취소"
                        @click="$emit('update:open', false)"
                    />
                    <Button
                        appearance="prominent"
                        class="route-save-modal__button route-save-modal__button--primary"
                        label="저장"
                        @click="$emit('submit')"
                    />
                </div>
            </div>
        </template>
    </UModal>
</template>

<style scoped src="~/assets/css/components/templates/RouteSaveModal.css"></style>
