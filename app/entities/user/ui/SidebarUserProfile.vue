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
        <button type="button" class="map-button flex gap-2.5 w-full px-3 py-2 border-none rounded-lg bg-transparent cursor-pointer items-center transition-[color,background] duration-150" @click="$emit('click')">
            <slot name="icon">
                <img v-if="image" :src="image" :alt="username" class="w-6 h-6 rounded-full object-cover shrink-0" />
                <div v-else class="w-6 h-6 rounded-full shrink-0 flex items-center justify-center bg-[color-mix(in_srgb,var(--ui-text-muted)_15%,transparent)]">
                    <UIcon name="i-lucide-user" class="w-3.5 h-3.5 text-inherit" />
                </div>
            </slot>

            <div class="flex flex-1 min-w-0 flex-row items-center justify-between gap-2">
                <slot>
                    <span class="text-[0.8125rem] font-medium text-[var(--ui-text-default)] overflow-hidden text-ellipsis whitespace-nowrap">{{ username }}</span>
                </slot>
                <span v-if="subtitle" class="text-[0.6875rem] text-[var(--ui-text-muted)] overflow-hidden text-ellipsis whitespace-nowrap">{{ subtitle }}</span>
            </div>

            <div class="hidden">
                <UIcon name="i-lucide-chevron-up-down" />
            </div>
        </button>
    </UDropdownMenu>

    <button v-else type="button" class="map-button flex gap-2.5 w-full px-3 py-2 border-none rounded-lg bg-transparent cursor-pointer items-center transition-[color,background] duration-150" @click="$emit('click')">
        <slot name="icon">
            <div class="w-6 h-6 rounded-full shrink-0 flex items-center justify-center bg-[color-mix(in_srgb,var(--ui-text-muted)_15%,transparent)]">
                <UIcon name="i-lucide-user" class="w-3.5 h-3.5 text-inherit" />
            </div>
        </slot>

        <div class="flex flex-1 min-w-0 flex-row items-center justify-between gap-2">
            <slot>
                <span class="text-[0.8125rem] font-medium text-[var(--ui-text-default)] overflow-hidden text-ellipsis whitespace-nowrap">로그인</span>
            </slot>
        </div>

        <div class="hidden">
            <UIcon name="i-lucide-chevron-up-down" />
        </div>
    </button>
</template>
