<script setup lang="ts">
defineProps<{
    groups: { key: string; label: string; color?: string }[]
    selected: string[]
}>()

defineEmits<{
    toggle: [key: string]
}>()
</script>

<template>
    <div class="flex flex-wrap gap-2 py-2" role="group" aria-label="레이어 필터">
        <UButton
            v-for="g in groups"
            :key="g.key"
            color="neutral"
            variant="outline"
            size="xs"
            :class="[
                'text-xs rounded-full transition-colors duration-150',
                selected.includes(g.key)
                    ? 'text-primary border-primary'
                    : 'text-muted border-default'
            ]"
            :aria-pressed="selected.includes(g.key)"
            @click="$emit('toggle', g.key)"
        >
            <template #leading>
                <span
                    class="inline-block w-2 h-2 rounded-full flex-shrink-0"
                    :style="g.color ? { background: g.color } : { background: 'currentColor' }"
                    aria-hidden="true"
                />
            </template>
            {{ g.label }}
        </UButton>
    </div>
</template>
