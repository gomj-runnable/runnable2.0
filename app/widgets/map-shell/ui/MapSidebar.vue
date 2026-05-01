<script setup lang="ts">
/**
 * MapSidebar — UHeader 기반 반응형 네비게이션
 *
 * 데스크톱(lg+): 왼쪽 로고 · 중앙 탭 · 우측 계정
 * 모바일(<lg): 로고 + DropdownMenu
 */
import type { NavigationMenuItem, DropdownMenuItem } from '@nuxt/ui'
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

/** 모바일 전용 DropdownMenu 아이템 */
const mobileDropdownItems = computed<DropdownMenuItem[]>(() => [
    {
        label: NavKey.LIST,
        icon: 'i-lucide-list',
        onSelect: () => emit('select', NavKey.LIST)
    },
    {
        label: NavKey.DRAW,
        icon: 'i-lucide-pencil',
        onSelect: () => emit('select', NavKey.DRAW)
    },
    {
        label: NavKey.EXPLORE,
        icon: 'i-lucide-search',
        onSelect: () => emit('select', NavKey.EXPLORE)
    },
    {
        label: props.isLoggedIn ? '내 계정' : '로그인',
        icon: 'i-lucide-user',
        onSelect: () => emit('select', NavKey.AUTH)
    }
])
</script>

<template>
    <UHeader title="Runnable" :toggle="false">
        <template #title>
            <img src="/logo/runnable_logo_main.svg" alt="Runnable" class="h-6 w-auto" />
        </template>

        <UNavigationMenu :items="topItems" color="primary" />

        <template #right>
            <UNavigationMenu :items="bottomItems" color="primary" class="hidden lg:flex" />

            <!-- 모바일: DropdownMenu -->
            <UDropdownMenu :items="mobileDropdownItems" :modal="false" class="lg:hidden">
                <UButton icon="i-lucide-menu" color="neutral" variant="ghost" />
            </UDropdownMenu>
        </template>
    </UHeader>
</template>
