<script setup lang="ts">
withDefaults(
    defineProps<{
        /** 표시할 이미지 URL */
        src?: string
        /** 이미지 대체 텍스트 */
        alt?: string
        /** 버튼 접근성 레이블 (미지정 시 alt 사용) */
        label?: string
        /** 비활성화 여부 */
        disabled?: boolean
        /** 버튼 타입 속성 */
        type?: 'button' | 'submit' | 'reset'
    }>(),
    {
        src: undefined,
        alt: '',
        label: undefined,
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
        class="map-button image-button"
        :aria-label="label || alt"
        :title="label || alt"
        :disabled="disabled"
        @click="$emit('click')"
    >
        <slot>
            <img v-if="src" :src="src" :alt="alt" class="image-button__image" />
        </slot>
    </button>
</template>

<style scoped src="./ImageButton.css"></style>
