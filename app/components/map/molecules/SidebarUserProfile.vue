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
            onSelect: () => {}
        },
        {
            label: '설정',
            icon: 'i-lucide-settings',
            onSelect: () => {}
        }
    ],
    [
        {
            label: '로그아웃',
            icon: 'i-lucide-log-out',
            color: 'error' as const,
            onSelect: () => {}
        }
    ]
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
                <img v-if="image" :src="image" :alt="username" class="sidebar-user__avatar" />
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

<style scoped src="~/assets/css/components/map/molecules/SidebarUserProfile.css"></style>
