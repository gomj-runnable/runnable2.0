<script setup lang="ts">
defineProps<{
    label: string
    active?: boolean
    icon?: string
}>()

defineEmits<{ click: [] }>()
</script>

<template>
    <button
        type="button"
        class="sidebar-route-item"
        :class="{ 'sidebar-route-item--active': active }"
        @click="$emit('click')"
    >
        <UIcon v-if="icon" :name="icon" class="sidebar-route-item__icon" />
        <span class="sidebar-route-item__label">{{ label }}</span>
        <!-- trailing: 배지, 화살표 등 추가 요소 -->
        <slot name="trailing" />
    </button>
</template>

<style scoped>
.sidebar-route-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 10px;
    border-radius: var(--radius-sm);
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    transition:
        background var(--transition),
        color var(--transition);
}

.sidebar-route-item:hover {
    background: var(--sidebar-item-hover);
    color: var(--text-primary);
}

.sidebar-route-item--active {
    background: var(--sidebar-item-active);
    color: var(--text-primary);
}

.sidebar-route-item__icon {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    opacity: 0.6;
}

.sidebar-route-item__label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
