<script setup lang="ts">
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
                        <input
                            :value="title"
                            type="text"
                            class="map-form-control"
                            placeholder="경로 제목"
                            @input="
                                $emit('update:title', ($event.target as HTMLInputElement).value)
                            "
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
                        <input
                            :value="formatDistance(distance)"
                            type="text"
                            class="map-form-control"
                            placeholder="0.00"
                            disabled
                        />
                    </label>
                </div>

                <div class="route-save-modal__actions">
                    <button
                        type="button"
                        class="map-button route-save-modal__button"
                        @click="$emit('update:open', false)"
                    >
                        취소
                    </button>
                    <button
                        type="button"
                        class="map-button route-save-modal__button route-save-modal__button--primary"
                        @click="$emit('submit')"
                    >
                        저장
                    </button>
                </div>
            </div>
        </template>
    </UModal>
</template>

<style scoped src="~/assets/css/components/map/templates/RouteSaveModal.css"></style>
