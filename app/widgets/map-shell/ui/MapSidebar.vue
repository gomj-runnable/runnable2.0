<script setup lang="ts">
/**
 * MapSidebar — 반응형 네비게이션
 *
 * 데스크톱(lg+): 세로 Nav Rail (collapsed, vertical, tooltip)
 * 모바일(<lg): 가로 헤더 바 (horizontal)
 */
import type { NavigationMenuItem } from '@nuxt/ui'
import { NavKey, type NavKeyValue } from '../model/nav-key'

const props = defineProps<{
    /** 현재 활성화된 네비게이션 항목 (null이면 선택 없음) */
    activeNav: NavKeyValue | null
    /** 로그인 상태 */
    isLoggedIn?: boolean
}>()

const emit = defineEmits<{
    select: [value: NavKeyValue]
}>()

const makeItem = (label: NavKeyValue, icon: string): NavigationMenuItem => ({
    label,
    icon,
    value: label,
    active: props.activeNav === label,
    onSelect: (e: Event) => {
        e.preventDefault()
        emit('select', label)
    }
})

const topItems = computed(() => [
    makeItem(NavKey.LIST, 'i-lucide-list'),
    makeItem(NavKey.DRAW, 'i-lucide-pencil'),
    makeItem(NavKey.EXPLORE, 'i-lucide-search')
])

const bottomItems = computed(() => [
    {
        ...makeItem(NavKey.AUTH, 'i-lucide-user'),
        label: props.isLoggedIn ? '내 계정' : '로그인'
    }
])

const tooltipProps = { delayDuration: 0, content: { side: 'right' as const } }
</script>

<template>
    <!-- 데스크톱: 세로 Nav Rail -->
    <nav class="hidden lg:flex flex-col items-center w-14 h-full shrink-0 py-2 bg-(--ui-bg-elevated) border-r border-(--ui-border) z-20">
        <UNavigationMenu
            orientation="vertical"
            collapsed
            :tooltip="tooltipProps"
            :items="topItems"
            color="primary"
        />
        <div class="flex-1" />
        <UNavigationMenu
            orientation="vertical"
            collapsed
            :tooltip="tooltipProps"
            :items="bottomItems"
            color="primary"
        />
    </nav>

    <!-- 모바일: 가로 헤더 바 -->
    <header class="flex lg:hidden items-center gap-2 w-full h-[var(--ui-header-height)] shrink-0 px-4 bg-(--ui-bg-elevated) border-b border-(--ui-border) z-20">
        <UIcon name="i-lucide-map-pin" class="size-5 shrink-0" />
        <UNavigationMenu
            :items="topItems"
            color="primary"
        />
        <div class="flex-1" />
        <UNavigationMenu
            :items="bottomItems"
            color="primary"
        />
    </header>
</template>
