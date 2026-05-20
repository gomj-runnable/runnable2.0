<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { NavKey, type NavKeyValue } from '../model/nav-key'

const props = defineProps<{
    activeNav: NavKeyValue | null
    isLoggedIn?: boolean
}>()

const emit = defineEmits<{
    select: [value: NavKeyValue]
}>()

const dropdownItems = computed<DropdownMenuItem[]>(() => [
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

        <template #right>
            <UColorModeButton />
            <UDropdownMenu :items="dropdownItems" :modal="false">
                <UButton
                    icon="i-lucide-menu"
                    color="neutral"
                    variant="ghost"
                    aria-label="메뉴 열기"
                />
            </UDropdownMenu>
        </template>
    </UHeader>
</template>
