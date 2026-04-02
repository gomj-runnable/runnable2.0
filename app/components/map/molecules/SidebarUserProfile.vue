<script setup lang="ts">
defineProps<{
    username?: string
    image?: string
}>()

defineEmits<{ click: [] }>()
</script>

<template>
    <button type="button" class="sidebar-user" @click="$emit('click')">
        <slot name="icon">
            <img
                v-if="image"
                :src="image"
                :alt="username"
                class="sidebar-user__avatar"
            />
            <UIcon v-else name="i-lucide-circle-user" class="sidebar-user__icon" />
        </slot>
        <slot>
            <span v-if="username" class="sidebar-user__name">{{ username }}</span>
            <span v-else class="sidebar-user__name">로그인</span>
        </slot>
    </button>
</template>

<style scoped>
.sidebar-user {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 10px;
    border-radius: var(--radius-md);
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    transition: background var(--transition), color var(--transition);
}

.sidebar-user:hover {
    background: var(--sidebar-item-hover);
    color: var(--text-primary);
}

.sidebar-user__avatar {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
}

.sidebar-user__icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    color: var(--sidebar-icon-color);
}

.sidebar-user__name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
