<script setup lang="ts">
// 헤더에서 그래픽 품질 설정 모달을 여는 버튼. UColorModeButton(야간모드) 왼쪽에 배치된다.
import GraphicQualityModal from './GraphicQualityModal.vue'

const isOpen = ref(false)
</script>

<template>
    <UButton
        icon="i-lucide-gauge"
        color="neutral"
        variant="ghost"
        aria-label="그래픽 품질 설정"
        @click="isOpen = true"
    />
    <GraphicQualityModal :open="isOpen" @update:open="isOpen = $event" />
</template>
