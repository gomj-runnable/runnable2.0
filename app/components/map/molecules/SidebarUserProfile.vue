<script setup lang="ts">
defineProps<{
    username?: string
    image?: string
}>()

const menuItems = [
    [
        {
            label: '프로필 편집',
            icon: 'i-lucide-user',
            onSelect: () => {},
        },
        {
            label: '설정',
            icon: 'i-lucide-settings',
            onSelect: () => {},
        },
    ],
    [
        {
            label: '로그아웃',
            icon: 'i-lucide-log-out',
            color: 'error' as const,
            onSelect: () => {},
        },
    ],
]
</script>

<template>
    <UDropdownMenu
        :items="menuItems"
        :content="{ side: 'top', align: 'start', sideOffset: 6 }"
        :ui="{ content: 'dropdown-profile-menu' }"
    >
        <button type="button" class="sidebar-user">
            <slot name="icon">
                <img
                    v-if="image"
                    :src="image"
                    :alt="username"
                    class="sidebar-user__avatar"
                />
                <div v-else class="sidebar-user__avatar sidebar-user__avatar--placeholder">
                    <UIcon name="i-lucide-user" class="sidebar-user__avatar-icon" />
                </div>
            </slot>
            <slot>
                <span class="sidebar-user__name">{{ username ?? '로그인' }}</span>
            </slot>
            <UIcon name="i-lucide-chevrons-up-down" class="sidebar-user__chevron" />
        </button>
    </UDropdownMenu>
</template>

<style scoped>
.sidebar-user {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 6px 10px;
    border-radius: var(--radius-md);
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
    transition: background var(--transition), color var(--transition);
}

.sidebar-user:hover {
    background: var(--sidebar-item-hover);
}

.sidebar-user__avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
}

.sidebar-user__avatar--placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--sidebar-item-active);
}

.sidebar-user__avatar-icon {
    width: 16px;
    height: 16px;
    color: var(--sidebar-icon-color);
}

.sidebar-user__name {
    flex: 1;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.sidebar-user__chevron {
    width: 16px;
    height: 16px;
    color: var(--sidebar-icon-color);
    flex-shrink: 0;
    margin-left: auto;
}
</style>
