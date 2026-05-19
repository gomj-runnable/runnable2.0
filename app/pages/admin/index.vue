<script setup lang="ts">
import { hasPermission, Permission } from '../../../shared/constants/permissions'
import { useAuthStore } from '~/entities/user/model/useAuthStore'
import type { SavedCurationCollection } from '../../../shared/types/curation'
import type { SavedSegment } from '../../../shared/types/segment'
import AdminSeedCard from './_components/AdminSeedCard.vue'

definePageMeta({ ssr: false })

const { user } = useAuthStore()

const { data: curations } = await useFetch<SavedCurationCollection[]>('/api/curation')
const { data: segments } = await useFetch<SavedSegment[]>('/api/segments')

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

const featureCards: AdminFeatureCard[] = [
    {
        key: 'curation',
        icon: 'i-lucide-sparkles',
        title: '큐레이션 관리',
        description: '계절·시간대별 경로 큐레이션 컬렉션을 관리합니다.',
        to: '/admin/curation',
        badge: () => `${curations.value?.length ?? 0}개`,
        badgeColor: 'info'
    },
    {
        key: 'segment',
        icon: 'i-lucide-trophy',
        title: '세그먼트 현황',
        description: '등록된 세그먼트 현황과 리더보드를 확인합니다.',
        badge: () => `${segments.value?.length ?? 0}개`,
        badgeColor: 'neutral'
    },
    {
        key: 'uml',
        icon: 'i-lucide-git-graph',
        title: 'UML Dashboard',
        description: '프로젝트 구조를 Mermaid 다이어그램으로 시각화합니다.',
        to: '/admin/uml',
        badge: () => '관리자',
        badgeColor: 'neutral',
        permission: Permission.VIEW_ADMIN_PAGE
    }
]

const visibleCards = computed(() =>
    featureCards.filter(
        (card) => !card.permission || hasPermission(user.value?.role, card.permission)
    )
)
</script>

<template>
    <div class="container mx-auto p-6">
        <header class="mb-6">
            <h1 class="text-2xl font-semibold">관리자 대시보드</h1>
            <p class="text-sm text-(--ui-text-muted) mt-1">관리자/개발자용 운영 도구입니다.</p>
        </header>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AdminSeedCard />

            <component
                :is="card.to ? resolveComponent('NuxtLink') : 'div'"
                v-for="card in visibleCards"
                :key="card.key"
                v-bind="card.to ? { to: card.to, class: 'block' } : {}"
            >
                <UCard
                    :ui="card.to ? { root: 'hover:ring-2 hover:ring-primary-500 transition' } : {}"
                >
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
            </component>
        </div>
    </div>
</template>
