<script setup lang="ts">
defineProps<{
    icon?: string
}>()

defineEmits<{ click: [] }>()
</script>

<template>
    <button type="button" class="sidebar-action-btn" @click="$emit('click')">
        <UIcon v-if="icon" :name="icon" class="sidebar-action-btn__icon" />
        <slot />
    </button>
</template>

<style scoped>
.sidebar-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    padding: 7px 10px;
    border-radius: var(--radius-md);
    border: 1px solid rgba(144, 213, 255, 0.28);
    background: rgba(244, 251, 255, 0.04);
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition:
        background var(--transition),
        color var(--transition),
        border-color var(--transition);
    white-space: nowrap;
}

.sidebar-action-btn:hover {
    background: var(--surface-hover);
    color: var(--text-on-dark);
    border-color: rgba(144, 213, 255, 0.42);
}

.sidebar-action-btn__icon {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
}
</style>
