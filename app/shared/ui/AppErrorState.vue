<script setup lang="ts">
defineProps<{
    title: string
    description?: string
    /** 재시도 버튼 라벨 (기본: 다시 시도) */
    retryLabel?: string
}>()

defineEmits<{ retry: [] }>()
</script>

<template>
    <div class="text-center py-12">
        <UIcon
            name="i-lucide-circle-alert"
            class="w-12 h-12 mx-auto mb-3 text-(--ui-error) opacity-80"
        />
        <p class="text-sm text-(--ui-text-highlighted)">{{ title }}</p>
        <p v-if="description" class="text-xs mt-1 text-(--ui-text-muted)">{{ description }}</p>
        <div class="mt-4 flex items-center justify-center gap-2">
            <UButton
                :label="retryLabel ?? '다시 시도'"
                icon="i-lucide-rotate-cw"
                size="sm"
                color="neutral"
                variant="outline"
                @click="$emit('retry')"
            />
            <slot name="action" />
        </div>
    </div>
</template>
