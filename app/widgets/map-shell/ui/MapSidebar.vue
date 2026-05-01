<script setup lang="ts">
/**
 * MapSidebar — UHeader 기반 반응형 네비게이션
 *
 * 데스크톱(lg+): 왼쪽 로고 · 중앙 탭 · 우측 계정
 * 모바일(<lg): 로고 + 햄버거 토글 → drawer 메뉴
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
</script>

<template>
    <UHeader title="Runnable" mode="drawer">
        <template #title>
            <img src="/logo/runnable_logo_main.svg" alt="Runnable" class="h-6 w-auto" />
        </template>

        <UNavigationMenu :items="topItems" color="primary" />

        <template #right>
            <UNavigationMenu :items="bottomItems" color="primary" />
        </template>

        <template #body>
            <UNavigationMenu
                orientation="vertical"
                :items="[...topItems, ...bottomItems]"
                color="primary"
                class="w-full"
            />
        </template>
    </UHeader>
</template>
