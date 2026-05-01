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
    <UCard
        class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] min-w-[220px] max-w-[320px]"
    >
        <div class="flex flex-col gap-1.5">
            <div class="flex justify-between items-center">
                <span class="text-sm font-semibold text-text-base">{{ name }}</span>
                <UButton
                    icon="i-lucide-x"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    @click="$emit('close')"
                />
            </div>
            <p class="text-[0.8125rem] text-(--ui-text-muted) m-0 leading-[1.4] break-words">
                {{ description }}
            </p>
            <span v-if="authorName" class="text-[0.6875rem] text-meta">{{ authorName }}</span>
        </div>
    </UCard>
</template>
