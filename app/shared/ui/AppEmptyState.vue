<script setup lang="ts">
// 목록/검색 결과가 없을 때 표시하는 공통 빈 상태 컴포넌트.
defineProps<{
    icon: string
    title: string
    description?: string
}>()
</script>

<template>
    <div class="text-center py-12 text-(--ui-text-muted)">
        <UIcon :name="icon" class="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p class="text-sm">{{ title }}</p>
        <p v-if="description" class="text-xs mt-1 text-(--ui-text-dimmed)">{{ description }}</p>
        <div v-if="$slots.action" class="mt-4">
            <slot name="action" />
        </div>
    </div>
</template>
