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
    <!-- isolate: 헤더가 자체 stacking context 를 강제 형성해서
         외부의 USlideover (z-30) 가 header (z-50) 위로 stacking 되는 케이스를 차단 (#239).
         class fall-through 가 root 에 안 닿아서(#247) ui slot 으로 직접 주입한다. -->
    <UHeader title="Runnable" :toggle="false" :ui="{ root: 'isolate' }">
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
