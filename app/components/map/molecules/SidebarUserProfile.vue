<script setup lang="ts">
withDefaults(
    defineProps<{
        username?: string
        image?: string
        subtitle?: string
    }>(),
    {
        username: undefined,
        image: undefined,
        subtitle: '계정 설정'
    }
)

defineEmits<{ click: [] }>()

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
        :content="{ side: 'top', align: 'start', sideOffset: 10 }"
        :ui="{ content: 'dropdown-profile-menu' }"
    >
        <button type="button" class="map-button sidebar-user" @click="$emit('click')">
            <slot name="icon">
                <img v-if="image" :src="image" :alt="username" class="sidebar-user__avatar" />
                <div v-else class="sidebar-user__avatar sidebar-user__avatar--placeholder">
                    <UIcon name="i-lucide-user" class="sidebar-user__avatar-icon" />
                </div>
            </slot>

            <div class="sidebar-user__content">
                <slot>
                    <span class="sidebar-user__name">{{ username ?? '로그인' }}</span>
                </slot>
                <span v-if="subtitle" class="sidebar-user__subtitle">{{ subtitle }}</span>
            </div>

            <div class="sidebar-user__trailing">
                <UIcon name="i-lucide-chevron-up-down" class="sidebar-user__chevron" />
            </div>
        </button>
    </UDropdownMenu>
</template>

<style scoped src="~/assets/css/components/map/molecules/SidebarUserProfile.css"></style>
