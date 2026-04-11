<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
    defineProps<{
        /** 버튼에 표시할 텍스트 레이블 */
        label?: string
        /** 버튼에 표시할 아이콘 이름 */
        icon?: string
        /** 아이콘을 텍스트 오른쪽(trailing)에 배치할지 여부 */
        iconTrailing?: boolean
        /** 시각적 강조 스타일 (지정하지 않으면 variant에서 자동 추론) */
        appearance?: 'plain' | 'secondary' | 'tinted' | 'prominent'
        /** 버튼의 의미 역할 (취소, 파괴적 동작 등) */
        role?: 'default' | 'cancel' | 'destructive'
        /** Material Design 계열 버튼 변형 (appearance 미지정 시 폴백으로 사용) */
        variant?: 'elevated' | 'filled' | 'tonal' | 'outlined' | 'text'
        /** 버튼 크기 */
        size?: 'sm' | 'md' | 'lg'
        /** 부모 너비를 꽉 채우는 블록 레이아웃 여부 */
        block?: boolean
        /** 활성(선택) 상태 여부 */
        active?: boolean
        /** 비활성화 여부 */
        disabled?: boolean
        /** 버튼 타입 속성 */
        type?: 'button' | 'submit' | 'reset'
    }>(),
    { iconTrailing: false, role: 'default', variant: 'filled', size: 'md', block: false, active: false, disabled: false, type: 'button' }
)

/** 버튼 클릭 이벤트 */
defineEmits<{ click: [] }>()

/** variant → appearance 폴백 매핑으로 실제 적용할 appearance 값을 반환한다 */
const resolvedAppearance = computed(() => {
    // appearance가 직접 지정된 경우 그대로 사용
    if (props.appearance) return props.appearance

    // variant 값을 appearance로 변환하는 폴백 매핑
    const fallbackMap = {
        elevated: 'secondary',
        filled: 'prominent',
        tonal: 'tinted',
        outlined: 'secondary',
        text: 'plain'
    } as const

    return fallbackMap[props.variant ?? 'filled']
})
</script>

<template>
    <button
        :type="type"
        class="map-button app-button"
        :class="[
            `app-button--${resolvedAppearance}`,
            `app-button--role-${role}`,
            `app-button--${size}`,
            {
                'is-block': block,
                'is-active': active,
                'has-trailing-icon': iconTrailing
            }
        ]"
        :disabled="disabled"
        :aria-label="label"
        @click="$emit('click')"
    >
        <slot name="leading">
            <UIcon
                v-if="icon && !iconTrailing"
                :name="icon"
                class="app-button__icon app-button__icon--leading"
            />
        </slot>
        <slot>
            <span v-if="label" class="app-button__label">{{ label }}</span>
        </slot>
        <slot name="trailing">
            <UIcon
                v-if="icon && iconTrailing"
                :name="icon"
                class="app-button__icon app-button__icon--trailing"
            />
        </slot>
    </button>
</template>

<style scoped src="~/assets/css/components/molecules/buttons/Button.css"></style>
