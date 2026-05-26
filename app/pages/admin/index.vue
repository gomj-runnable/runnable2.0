<script setup lang="ts">
/**
 * 관리자 대시보드 — 카드 분기점 스켈레톤.
 *
 * featureCards 에 항목을 추가하면 그리드에 카드로 노출된다.
 * 카드별 icon / title / description / to (라우트) / permission (선택) 만 정의하면 된다.
 */
import { hasPermission } from '../../../shared/constants/permissions'
import type { Permission } from '../../../shared/constants/permissions'
import { useAuthStore } from '~/entities/user/model/useAuthStore'

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

        <div
            v-if="visibleCards.length === 0"
            class="rounded-lg border border-dashed border-(--ui-border) p-8 text-center text-sm text-(--ui-text-muted)"
        >
            추후 관리자 기능이 여기에 표시됩니다.
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
