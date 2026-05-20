<script setup lang="ts">
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
