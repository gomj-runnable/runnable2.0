<script setup lang="ts">
import { hasPermission } from '../../../shared/constants/permissions'
import type { Permission } from '../../../shared/constants/permissions'
import { useAuthStore } from '~/entities/user/model/useAuthStore'
import AdminSeedCard from './_components/AdminSeedCard.vue'

definePageMeta({ ssr: false })

const { user } = useAuthStore()

interface AdminFeatureCard {
    key: string
    icon: string
    title: string
    description: string
    to?: string
    badge?: () => string
    badgeColor?: string
    permission?: Permission
}

const featureCards: AdminFeatureCard[] = []

const visibleCards = computed(() =>
    featureCards.filter(
        (card) => !card.permission || hasPermission(user.value?.role, card.permission)
    )
)
</script>

<template>
    <div class="container mx-auto p-6">
        <header class="mb-6 flex items-start justify-between gap-2">
            <div>
                <h1 class="text-2xl font-semibold">관리자 대시보드</h1>
                <p class="text-sm text-(--ui-text-muted) mt-1">관리자/개발자용 운영 도구입니다.</p>
            </div>
            <UColorModeButton />
        </header>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AdminSeedCard />

            <template v-for="card in visibleCards" :key="card.key">
                <NuxtLink v-if="card.to" :to="card.to" class="block">
                    <UCard :ui="{ root: 'hover:ring-2 hover:ring-primary-500 transition' }">
                        <template #header>
                            <div class="flex items-center gap-2">
                                <UIcon :name="card.icon" class="w-5 h-5" />
                                <h2 class="font-medium">{{ card.title }}</h2>
                                <UBadge
                                    v-if="card.badge"
                                    :color="(card.badgeColor as any) ?? 'neutral'"
                                    variant="subtle"
                                    size="xs"
                                    class="ml-auto"
                                >
                                    {{ card.badge() }}
                                </UBadge>
                            </div>
                        </template>
                        <p class="text-sm text-(--ui-text-muted)">{{ card.description }}</p>
                    </UCard>
                </NuxtLink>
                <UCard v-else>
                    <template #header>
                        <div class="flex items-center gap-2">
                            <UIcon :name="card.icon" class="w-5 h-5" />
                            <h2 class="font-medium">{{ card.title }}</h2>
                            <UBadge
                                v-if="card.badge"
                                :color="(card.badgeColor as any) ?? 'neutral'"
                                variant="subtle"
                                size="xs"
                                class="ml-auto"
                            >
                                {{ card.badge() }}
                            </UBadge>
                        </div>
                    </template>
                    <p class="text-sm text-(--ui-text-muted)">{{ card.description }}</p>
                </UCard>
            </template>
        </div>
    </div>
</template>
