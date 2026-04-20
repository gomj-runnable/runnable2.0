<script setup lang="ts">
import IconButton from '~/shared/ui/buttons/IconButton.vue'

withDefaults(
    defineProps<{
        /** 버튼의 접근성 레이블 (기본값: '도움말') */
        label?: string
        /** 비활성화 여부 */
        disabled?: boolean
        /** 버튼 타입 속성 */
        type?: 'button' | 'submit' | 'reset'
    }>(),
    {
        label: '도움말',
        disabled: false,
        type: 'button'
    }
)

/** 버튼 클릭 이벤트 */
defineEmits<{ click: [] }>()
</script>

<template>
    <IconButton
        icon="i-lucide-circle-help"
        :label="label"
        appearance="plain"
        class="help-button"
        :disabled="disabled"
        :type="type"
        @click="$emit('click')"
    />
</template>

<style scoped src="./HelpButton.css"></style>
