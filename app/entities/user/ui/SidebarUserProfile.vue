<script setup lang="ts">
withDefaults(
    defineProps<{
        /** 표시할 사용자 이름 (미지정 시 '로그인' 표시) */
        username?: string
        /** 사용자 아바타 이미지 URL */
        image?: string
        /** 사용자 이름 아래 표시할 부제목 텍스트 */
        subtitle?: string
    }>(),
    {
        username: undefined,
        image: undefined,
        subtitle: '계정 설정'
    }
)

/** 프로필 버튼 클릭 이벤트 / 로그아웃 메뉴 선택 이벤트 */
const emit = defineEmits<{ click: []; logout: [] }>()

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
            onSelect: () => emit('logout')
        }
    ]
]
</script>

<template>
    <UDropdownMenu
        v-if="username"
        :items="menuItems"
        :content="{ side: 'top', align: 'start', sideOffset: 10 }"
        :ui="{ content: 'dropdown-profiles-menu' }"
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
                    <span class="sidebar-user__name">{{ username }}</span>
                </slot>
                <span v-if="subtitle" class="sidebar-user__subtitle">{{ subtitle }}</span>
            </div>

            <div class="sidebar-user__trailing">
                <UIcon name="i-lucide-chevron-up-down" class="sidebar-user__chevron" />
            </div>
        </button>
    </UDropdownMenu>

    <button v-else type="button" class="map-button sidebar-user" @click="$emit('click')">
        <slot name="icon">
            <div class="sidebar-user__avatar sidebar-user__avatar--placeholder">
                <UIcon name="i-lucide-user" class="sidebar-user__avatar-icon" />
            </div>
        </slot>

        <div class="sidebar-user__content">
            <slot>
                <span class="sidebar-user__name">로그인</span>
            </slot>
        </div>

        <div class="sidebar-user__trailing">
            <UIcon name="i-lucide-chevron-up-down" class="sidebar-user__chevron" />
        </div>
    </button>
</template>

<style scoped src="./SidebarUserProfile.css"></style>
