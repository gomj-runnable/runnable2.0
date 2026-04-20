<script setup lang="ts">
/** 경로정보 입력 폼 — 지도 클릭으로 선택된 위치에 장소명과 설명을 작성한다 */
const props = defineProps<{
    lng: number
    lat: number
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
    <div class="route-info-input-form">
        <div class="route-info-input-form__header">
            <span class="route-info-input-form__title">경로정보 남기기</span>
            <button class="route-info-input-form__close" @click="emit('cancel')">
                <UIcon name="i-lucide-x" />
            </button>
        </div>
        <div class="route-info-input-form__coord">
            {{ props.lng.toFixed(5) }}, {{ props.lat.toFixed(5) }}
        </div>
        <input
            v-model="name"
            class="route-info-input-form__name-input"
            placeholder="장소명"
            maxlength="100"
        />
        <textarea
            v-model="description"
            class="route-info-input-form__textarea"
            placeholder="이 구간에 대한 의견을 남겨주세요"
            maxlength="500"
            rows="3"
        />
        <div class="route-info-input-form__actions">
            <button
                class="route-info-input-form__btn route-info-input-form__btn--cancel"
                @click="emit('cancel')"
            >
                취소
            </button>
            <button
                class="route-info-input-form__btn route-info-input-form__btn--submit"
                :disabled="!name.trim() || !description.trim()"
                @click="handleSubmit"
            >
                등록
            </button>
        </div>
    </div>
</template>

<style scoped src="./RouteInfoInputForm.css"></style>
