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
    <div class="ds-legend" role="group" aria-label="레이어 필터">
        <UButton
            v-for="g in groups"
            :key="g.key"
            color="neutral"
            variant="outline"
            size="xs"
            class="ds-legend__item"
            :class="{ 'ds-legend__item--active': selected.includes(g.key) }"
            :aria-pressed="selected.includes(g.key)"
            @click="$emit('toggle', g.key)"
        >
            <template #leading>
                <span
                    class="ds-legend__dot"
                    :style="g.color ? { background: g.color } : {}"
                    aria-hidden="true"
                />
            </template>
            {{ g.label }}
        </UButton>
    </div>
</template>

<style scoped>
.ds-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.5rem 0;
}

.ds-legend__item {
    font-size: 0.75rem;
    border-color: var(--ds-border);
    color: var(--ds-text-muted);
    border-radius: 9999px;
    transition:
        color var(--ds-transition),
        border-color var(--ds-transition);
}

.ds-legend__item--active {
    color: var(--ds-primary);
    border-color: var(--ds-primary);
}

.ds-legend__dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
}
</style>
