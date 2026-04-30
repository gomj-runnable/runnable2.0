<script setup lang="ts">
/** 경로정보 마커 클릭 시 표시되는 오버레이 팝업 */
defineProps<{
    name: string
    description: string
    authorName?: string
}>()

defineEmits<{
    close: []
}>()
</script>

<template>
    <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] flex flex-col gap-1.5 p-3 bg-surface-dark rounded-lg border border-border-accent min-w-[220px] max-w-[320px] shadow-[0_12px_32px_rgba(0,0,0,0.16)]">
        <div class="flex justify-between items-center">
            <span class="text-sm font-semibold text-text-base">{{ name }}</span>
            <button class="bg-none border-none text-meta cursor-pointer p-0.5" @click="$emit('close')">
                <UIcon name="i-lucide-x" />
            </button>
        </div>
        <p class="text-[0.8125rem] text-[#cdd1d5] m-0 leading-[1.4] break-words">{{ description }}</p>
        <span v-if="authorName" class="text-[0.6875rem] text-meta">{{ authorName }}</span>
    </div>
</template>
