<script setup lang="ts">
type SegmentItem = {
    value: string
    label?: string
    icon?: string
    disabled?: boolean
}

const props = withDefaults(
    defineProps<{
        /** 세그먼트 항목 목록 (value, label, icon, disabled 포함) */
        items: readonly SegmentItem[]
        /** 현재 선택된 값 (단일: string, 다중: string[], 없음: null) */
        modelValue: string | string[] | null
        /** 다중 선택 허용 여부 */
        multiple?: boolean
        /** 컨테이너 너비를 꽉 채우는 레이아웃 여부 */
        fullWidth?: boolean
    }>(),
    {
        multiple: false,
        fullWidth: false
    }
)

/** 선택 값 변경 이벤트 */
const emit = defineEmits<{
    'update:modelValue': [value: string | string[] | null]
}>()

/** 주어진 value가 현재 선택 상태인지 확인한다 */
const isSelected = (value: string) => {
    // 다중 선택 모드에서는 배열 포함 여부로 판단
    if (props.multiple) {
        return Array.isArray(props.modelValue) && props.modelValue.includes(value)
    }

    return props.modelValue === value
}

/** 세그먼트 항목을 토글하고 변경 이벤트를 발행한다 */
const toggleValue = (value: string) => {
    // 다중 선택 모드: 배열에서 추가 또는 제거
    if (props.multiple) {
        const current = Array.isArray(props.modelValue) ? [...props.modelValue] : []
        const next = current.includes(value)
            ? current.filter((item) => item !== value)
            : [...current, value]
        emit('update:modelValue', next)
        return
    }

    // 단일 선택 모드: 같은 값 클릭 시 선택 해제(null)
    emit('update:modelValue', props.modelValue === value ? null : value)
}
</script>

<template>
    <div class="segmented-button" :class="{ 'is-full-width': fullWidth }" role="group">
        <button
            v-for="item in items"
            :key="item.value"
            type="button"
            class="map-button segmented-button__item"
            :class="{ 'is-active': isSelected(item.value) }"
            :disabled="item.disabled"
            :aria-pressed="isSelected(item.value)"
            @click="toggleValue(item.value)"
        >
            <UIcon v-if="item.icon" :name="item.icon" class="segmented-button__icon" />
            <span v-if="item.label" class="segmented-button__label">{{ item.label }}</span>
        </button>
    </div>
</template>

<style scoped src="~/assets/css/components/molecules/buttons/SegmentedButton.css"></style>
