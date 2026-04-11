<script setup lang="ts">
import Button from '~/components/map/molecules/buttons/Button.vue'

withDefaults(
    defineProps<{
        /** 버튼에 표시할 텍스트 레이블 */
        label?: string
        /** 버튼에 표시할 아이콘 이름 */
        icon?: string
        /** 아이콘을 텍스트 오른쪽(trailing)에 배치할지 여부 */
        iconTrailing?: boolean
        /** prominent(강조) appearance 적용 여부 (false이면 secondary) */
        emphasized?: boolean
        /** 버튼의 의미 역할 (취소, 파괴적 동작 등) */
        role?: 'default' | 'cancel' | 'destructive'
        /** 버튼 크기 */
        size?: 'sm' | 'md' | 'lg'
        /** 부모 너비를 꽉 채우는 블록 레이아웃 여부 */
        block?: boolean
        /** 비활성화 여부 */
        disabled?: boolean
        /** 버튼 타입 속성 */
        type?: 'button' | 'submit' | 'reset'
    }>(),
    {
        label: undefined,
        icon: undefined,
        iconTrailing: false,
        emphasized: false,
        role: 'default',
        size: 'md',
        block: false,
        disabled: false,
        type: 'button'
    }
)

/** 버튼 클릭 이벤트 */
defineEmits<{ click: [] }>()
</script>

<template>
    <Button
        :label="label"
        :icon="icon"
        :icon-trailing="iconTrailing"
        :appearance="emphasized ? 'prominent' : 'secondary'"
        :role="role"
        :size="size"
        :block="block"
        :disabled="disabled"
        :type="type"
        class="push-button"
        @click="$emit('click')"
    >
        <slot />
    </Button>
</template>

<style scoped src="~/assets/css/components/molecules/buttons/PushButton.css"></style>
