<script setup lang="ts">
const props = withDefaults(
    defineProps<{
        /** 버튼에 표시할 아이콘 이름 */
        icon?: string
        /** 접근성 aria-label 및 title에 사용할 레이블 */
        label?: string
        /** 시각적 강조 스타일 */
        appearance?: 'plain' | 'secondary' | 'tinted' | 'prominent'
        /** 버튼의 의미 역할 (취소, 파괴적 동작 등) */
        role?: 'default' | 'cancel' | 'destructive'
        /** 활성(선택) 상태 여부 */
        active?: boolean
        /** 비활성화 여부 */
        disabled?: boolean
        /** 버튼 타입 속성 */
        type?: 'button' | 'submit' | 'reset'
    }>(),
    { appearance: 'plain', role: 'default', active: false, disabled: false, type: 'button' }
)

/** 버튼 클릭 이벤트 (MouseEvent 포함) */
defineEmits<{ click: [event: MouseEvent] }>()
</script>

<template>
    <button
        :type="type"
        class="map-button icon-button"
        :class="[
            `icon-button--${appearance}`,
            `icon-button--role-${role}`,
            {
                'is-active': active,
                'has-label': !!$slots.default || !!label
            }
        ]"
        :aria-label="label"
        :title="label"
        :disabled="disabled"
        @click="$emit('click', $event)"
    >
        <slot name="icon">
            <UIcon v-if="icon" :name="icon" class="icon-button__icon" />
        </slot>
        <slot>
            <span v-if="label" class="icon-button__label">{{ label }}</span>
        </slot>
    </button>
</template>

<style scoped src="~/assets/css/components/molecules/buttons/IconButton.css"></style>
