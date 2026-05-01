<script setup lang="ts">
import type { RouteDiscoverCard } from '#shared/types/discover'
import Card from '~/shared/ui/cards/Card.vue'
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

/**
 * 고도 범위 문자열을 반환한다.
 * @param high - 최고 고도 (meters)
 * @param low - 최저 고도 (meters)
 */
const formatElevation = (high?: number, low?: number): string => {
    if (high == null && low == null) return ''
    if (high != null && low != null) return `${Math.round(low)}–${Math.round(high)}m`
    if (high != null) return `최고 ${Math.round(high)}m`
    if (low != null) return `최저 ${Math.round(low)}m`
    return ''
}
</script>

<template>
    <Card interactive :selected="selected" as="article" @click="$emit('select', route.routeId)">
        <template #header>
            <div class="flex items-start justify-between gap-2.5">
                <h3 class="m-0 text-lg font-bold leading-[1.2] tracking-[-0.02em] text-text-base">
                    {{ route.title }}
                </h3>
                <span
                    v-if="route.districts?.length"
                    class="shrink-0 text-xs font-medium text-text-muted whitespace-nowrap"
                >
                    {{ route.districts.join(' · ') }}
                </span>
            </div>
        </template>

        <div class="flex flex-wrap gap-1.5 mt-1.5">
            <span v-if="route.distance" class="stat text-sm text-text-muted">
                {{ formatDistance(route.distance) }}
            </span>
            <span
                v-if="formatElevation(route.highHeight, route.lowHeight)"
                class="stat text-sm text-text-muted"
            >
                {{ formatElevation(route.highHeight, route.lowHeight) }}
            </span>
        </div>

        <template #meta>
            <span
                v-if="route.authorName"
                class="text-[0.8125rem] font-medium leading-[1.4] text-text-dimmed"
            >
                {{ route.authorName }}
            </span>
        </template>
    </Card>
</template>

<style scoped>
.stat + .stat::before {
    content: '·';
    margin-right: 0.375rem;
    color: color-mix(in srgb, #e6e8ea 80%, transparent);
}
</style>
