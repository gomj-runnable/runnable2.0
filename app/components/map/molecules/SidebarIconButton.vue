<script setup lang="ts">
defineProps<{
    icon: string
    label: string
    active?: boolean
}>()

defineEmits<{ click: [] }>()
</script>

<template>
    <button
        type="button"
        class="sidebar-icon-btn"
        :class="{ 'sidebar-icon-btn--active': active }"
        :aria-label="label"
        :title="label"
        @click="$emit('click')"
    >
        <slot>
            <UIcon :name="icon" class="sidebar-icon-btn__icon" />
        </slot>
    </button>
</template>

<style scoped>
.sidebar-icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    border: none;
    background: transparent;
    cursor: pointer;
    color: var(--sidebar-icon-color);
    transition: color var(--transition), background var(--transition);
    flex-shrink: 0;
}

.sidebar-icon-btn:hover {
    color: var(--sidebar-icon-hover);
    background: var(--sidebar-item-hover);
}

.sidebar-icon-btn--active {
    color: var(--sidebar-icon-hover);
    background: var(--sidebar-item-active);
}

.sidebar-icon-btn__icon {
    width: 18px;
    height: 18px;
}
</style>
