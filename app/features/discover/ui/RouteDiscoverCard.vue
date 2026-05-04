<script setup lang="ts">
import type { RouteDiscoverCard } from '#shared/types/discover'
import { getRouteInfoItems as getBaseRouteInfoItems } from '~/shared/lib/useRouteInfoFormat'

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
    const items = getBaseRouteInfoItems(route)
    if (route.authorName) items.push({ key: '작성자', value: route.authorName })
    return items
}
</script>

<template>
    <UCard
        variant="subtle"
        class="cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--ui-primary)]"
        :class="{ 'ring-2 ring-[var(--ui-primary)]': selected }"
        tabindex="0"
        role="button"
        @click="$emit('select', route.routeId)"
        @keydown.enter="$emit('select', route.routeId)"
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
