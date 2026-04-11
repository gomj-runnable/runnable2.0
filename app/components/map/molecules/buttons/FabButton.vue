<script setup lang="ts">
withDefaults(
    defineProps<{
        /** FAB에 표시할 아이콘 이름 (필수) */
        icon: string
        /** extended 모드일 때 아이콘 옆에 표시할 텍스트 레이블 */
        label?: string
        /** FAB 크기 */
        size?: 'small' | 'medium' | 'large'
        /** 텍스트 레이블을 함께 표시하는 확장 모드 여부 */
        extended?: boolean
        /** 비활성화 여부 */
        disabled?: boolean
        /** 버튼 타입 속성 */
        type?: 'button' | 'submit' | 'reset'
    }>(),
    {
        label: undefined,
        size: 'medium',
        extended: false,
        disabled: false,
        type: 'button'
    }
)

/** 버튼 클릭 이벤트 */
defineEmits<{ click: [] }>()
</script>

<template>
    <button
        :type="type"
        class="map-button fab-button"
        :class="[
            `fab-button--${size}`,
            {
                'is-extended': extended
            }
        ]"
        :disabled="disabled"
        @click="$emit('click')"
    >
        <UIcon :name="icon" class="fab-button__icon" />
        <span v-if="extended && label" class="fab-button__label">{{ label }}</span>
    </button>
</template>

<style scoped src="~/assets/css/components/molecules/buttons/FabButton.css"></style>
