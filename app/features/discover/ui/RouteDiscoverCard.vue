<script setup lang="ts">
import type { RouteDiscoverCard } from '#shared/types/discover'
import { formatDistance } from '~/shared/lib/useFormatUtils'

defineProps<{
    /** 경로 카드 데이터 */
    route: RouteDiscoverCard
    /** 선택 상태 여부 */
    selected?: boolean
}>()

defineEmits<{
    /** 카드 클릭 시 경로 ID를 전달 */
    select: [routeId: string]
}>()

function getRouteInfoItems(route: RouteDiscoverCard) {
    const items: { key: string; value: string }[] = []
    if (route.distance) items.push({ key: '거리', value: formatDistance(route.distance) })
    if (route.highHeight) items.push({ key: '최고 고도', value: `${Math.round(route.highHeight)}m` })
    if (route.lowHeight) items.push({ key: '최저 고도', value: `${Math.round(route.lowHeight)}m` })
    if (route.authorName) items.push({ key: '작성자', value: route.authorName })
    return items
}
</script>

<template>
    <UCard
        variant="subtle"
        class="cursor-pointer"
        :class="{ 'ring-2 ring-[var(--ui-primary)]': selected }"
        @click="$emit('select', route.routeId)"
    >
        <template #header>
            <div class="flex items-start justify-between gap-2">
                <p class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
                    {{ route.title }}
                </p>
                <span
                    v-if="route.districts?.length"
                    class="shrink-0 text-xs font-medium text-[var(--ui-text-muted)] whitespace-nowrap"
                >
                    {{ route.districts.join(' · ') }}
                </span>
            </div>
        </template>

        <UScrollArea
            orientation="vertical"
            :items="getRouteInfoItems(route)"
            :virtualize="{ lanes: 2, gap: 8 }"
            :ui="{ root: 'max-h-28' }"
        >
            <template #default="{ item }">
                <div class="flex justify-between text-sm py-0.5">
                    <dt class="text-[var(--ui-text-dimmed)]">{{ item.key }}</dt>
                    <dd class="font-medium m-0">{{ item.value }}</dd>
                </div>
            </template>
        </UScrollArea>
    </UCard>
</template>
