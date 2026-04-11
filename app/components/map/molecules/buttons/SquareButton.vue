<script setup lang="ts">
import IconButton from '~/components/map/molecules/buttons/IconButton.vue'

withDefaults(
    defineProps<{
        /** 버튼에 표시할 아이콘 이름 */
        icon?: string
        /** 접근성 레이블 */
        label?: string
        /** 버튼 크기 */
        size?: 'sm' | 'md' | 'lg'
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
    {
        icon: undefined,
        label: undefined,
        size: 'md',
        appearance: 'secondary',
        role: 'default',
        active: false,
        disabled: false,
        type: 'button'
    }
)

/** 버튼 클릭 이벤트 */
defineEmits<{ click: [] }>()
</script>

<template>
    <IconButton
        :icon="icon"
        :label="label"
        :appearance="appearance"
        :role="role"
        :active="active"
        :disabled="disabled"
        :type="type"
        class="square-button"
        :class="`square-button--${size}`"
        @click="$emit('click')"
    >
        <slot />
    </IconButton>
</template>

<style scoped src="~/assets/css/components/molecules/buttons/SquareButton.css"></style>
