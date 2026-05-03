<script setup lang="ts">
import type { RecommendedRoute } from '#shared/types/weather-recommend'

const props = defineProps<{
    /** 추천 경로 데이터 */
    route: RecommendedRoute
}>()

defineEmits<{
    /** 카드 선택 시 routeId 전달 */
    select: [routeId: string]
}>()

/** 거리를 km 단위 문자열로 변환한다 */
const distanceLabel = computed(() => {
    if (!props.route.distance) return null
    return `${(props.route.distance / 1000).toFixed(1)}km`
})

/** 고도차 레이블을 반환한다 */
const elevationLabel = computed(() => {
    if (props.route.highHeight == null || props.route.lowHeight == null) return null
    const diff = props.route.highHeight - props.route.lowHeight
    return `고도차 ${diff}m`
})

/** 점수에 따른 색상 클래스를 반환한다 */
const scoreColorClass = computed(() => {
    if (props.route.score >= 80) return 'is-score-good'
    if (props.route.score >= 50) return 'is-score-moderate'
    return 'is-score-low'
})
</script>

<template>
    <UCard variant="subtle" class="cursor-pointer" @click="$emit('select', route.routeId)">
        <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between gap-2.5">
                <span
                    class="text-sm font-semibold text-[var(--ui-text-highlighted)] overflow-hidden text-ellipsis whitespace-nowrap"
                    >{{ route.title }}</span
                >
                <span
                    class="shrink-0 text-[0.8125rem] font-bold"
                    :class="{
                        'text-green-500': scoreColorClass === 'is-score-good',
                        'text-amber-500': scoreColorClass === 'is-score-moderate',
                        'text-red-500': scoreColorClass === 'is-score-low'
                    }"
                >
                    {{ route.score }}점
                </span>
            </div>

            <div class="h-1 rounded-sm bg-[var(--ui-bg-accented)] overflow-hidden">
                <div
                    class="h-full rounded-sm transition-[width] duration-300"
                    :class="{
                        'bg-green-500': scoreColorClass === 'is-score-good',
                        'bg-amber-500': scoreColorClass === 'is-score-moderate',
                        'bg-red-500': scoreColorClass === 'is-score-low'
                    }"
                    :style="{ width: `${route.score}%` }"
                />
            </div>

            <div v-if="distanceLabel || elevationLabel" class="flex items-center gap-3">
                <span
                    v-if="distanceLabel"
                    class="inline-flex items-center gap-1 text-xs text-[var(--ui-text-muted)]"
                >
                    <span class="i-lucide-map-pin" />
                    {{ distanceLabel }}
                </span>
                <span
                    v-if="elevationLabel"
                    class="inline-flex items-center gap-1 text-xs text-[var(--ui-text-muted)]"
                >
                    <span class="i-lucide-mountain" />
                    {{ elevationLabel }}
                </span>
            </div>

            <div v-if="route.tags.length > 0" class="flex flex-wrap gap-1">
                <span
                    v-for="tag in route.tags"
                    :key="tag"
                    class="px-1.5 py-[2px] rounded-lg bg-[var(--ui-bg-accented)] text-[var(--ui-primary)] text-xs font-medium whitespace-nowrap"
                >
                    {{ tag }}
                </span>
            </div>
        </div>
    </UCard>
</template>
