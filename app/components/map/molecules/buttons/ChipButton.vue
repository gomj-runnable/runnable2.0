<script setup lang="ts">
withDefaults(
    defineProps<{
        /** 칩 버튼에 표시할 텍스트 레이블 */
        label?: string
        /** 칩 버튼에 표시할 아이콘 이름 */
        icon?: string
        /** 아이콘을 텍스트 오른쪽(trailing)에 배치할지 여부 */
        iconTrailing?: boolean
        /** 시각적 스타일 변형 */
        appearance?: 'default' | 'elevated' | 'tinted' | 'outlined'
        /** 칩 버튼 크기 */
        size?: 'xs' | 'sm' | 'md' | 'lg'
        /** 활성(선택) 상태 여부 */
        active?: boolean
        /** 비활성화 여부 */
        disabled?: boolean
        /** 버튼 타입 속성 */
        type?: 'button' | 'submit' | 'reset'
    }>(),
    { iconTrailing: false, appearance: 'default', size: 'md', active: false, disabled: false, type: 'button' }
)

/** 버튼 클릭 이벤트 (MouseEvent 포함) */
defineEmits<{ click: [event: MouseEvent] }>()
</script>

<template>
    <button
        :type="type"
        class="map-button chip-button"
        :class="[
            `chip-button--${size}`,
            `chip-button--${appearance}`,
            {
                'is-active': active,
                'has-trailing-icon': iconTrailing
            }
        ]"
        :disabled="disabled"
        :aria-label="label"
        @click="$emit('click', $event)"
    >
        <slot name="leading">
            <UIcon
                v-if="icon && !iconTrailing"
                :name="icon"
                class="chip-button__icon"
            />
        </slot>
        <slot>
            <span v-if="label" class="chip-button__label">{{ label }}</span>
        </slot>
        <slot name="trailing">
            <UIcon
                v-if="icon && iconTrailing"
                :name="icon"
                class="chip-button__icon"
            />
        </slot>
    </button>
</template>

<style scoped src="~/assets/css/components/molecules/buttons/ChipButton.css"></style>
