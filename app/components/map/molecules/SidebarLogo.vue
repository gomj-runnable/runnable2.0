<script setup lang="ts">
defineProps<{
    icon?: string
    label?: string
}>()
</script>

<template>
    <div class="sidebar-logo">
        <slot name="icon">
            <UIcon v-if="icon" :name="icon" class="sidebar-logo__icon" />
        </slot>
        <slot>
            <span v-if="label" class="sidebar-logo__label">{{ label }}</span>
        </slot>
    </div>
</template>

<style scoped>
.sidebar-logo {
    display: flex;
    align-items: center;
    gap: 6px;
}

.sidebar-logo__icon {
    width: 20px;
    height: 20px;
    color: var(--primary-color);
    flex-shrink: 0;
}

.sidebar-logo__label {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-on-dark);
    letter-spacing: -0.02em;
    white-space: nowrap;
}
</style>
