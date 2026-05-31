<script setup lang="ts">
// 두 경로의 거리·고도·시설 통계를 나란히 비교해 보여주는 모달 컴포넌트.
import type { RouteCompareItem, RouteCompareResponse } from '#shared/types/route-compare'

defineProps<{
    open: boolean
    isLoading: boolean
    result: RouteCompareResponse | null
    errorMessage: string | null
}>()

defineEmits<{ 'update:open': [value: boolean] }>()

/** 분 단위 숫자를 "N시간 M분" 형식으로 변환한다. */
const formatDuration = (min: number) => {
    const h = Math.floor(min / 60)
    const m = Math.round(min % 60)
    return h > 0 ? `${h}시간 ${m}분` : `${m}분`
}

/** 경로 비교 항목의 시설 종류별 개수 합계를 계산한다. */
const facilitiesTotal = (item: RouteCompareItem) =>
    Object.values(item.meta.facilityCounts ?? {}).reduce((acc, n) => acc + n, 0)
</script>

<template>
    <UModal
        :open="open"
        title="경로 비교"
        :ui="{ content: 'max-w-3xl' }"
        @update:open="$emit('update:open', $event)"
    >
        <template #body>
            <div v-if="isLoading" class="py-6 text-center text-sm text-(--ui-text-muted)">
                비교 중...
            </div>
            <div v-else-if="errorMessage" class="py-6 text-center text-sm text-(--ui-error)">
                {{ errorMessage }}
            </div>
            <div v-else-if="result" class="grid grid-cols-2 gap-3">
                <div
                    v-for="(item, key) in { A: result.routeA, B: result.routeB }"
                    :key="key"
                    class="rounded-lg border border-(--ui-border) p-3"
                >
                    <div class="text-xs text-(--ui-text-dimmed) mb-1">경로 {{ key }}</div>
                    <div class="font-semibold truncate">{{ item.route.title }}</div>
                    <div v-if="item.route.authorName" class="text-xs text-(--ui-text-muted) mb-2">
                        {{ item.route.authorName }}
                    </div>
                    <dl class="text-sm space-y-1">
                        <div class="flex justify-between">
                            <dt class="text-(--ui-text-dimmed)">거리</dt>
                            <dd class="font-medium">{{ item.meta.distanceKm.toFixed(2) }} km</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-(--ui-text-dimmed)">누적 상승</dt>
                            <dd class="font-medium">{{ Math.round(item.meta.ascentM) }} m</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-(--ui-text-dimmed)">누적 하강</dt>
                            <dd class="font-medium">{{ Math.round(item.meta.descentM) }} m</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-(--ui-text-dimmed)">예상 시간</dt>
                            <dd class="font-medium">
                                {{ formatDuration(item.meta.estimatedDurationMin) }}
                            </dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-(--ui-text-dimmed)">주변 시설</dt>
                            <dd class="font-medium">{{ facilitiesTotal(item) }}</dd>
                        </div>
                    </dl>
                </div>
            </div>
        </template>
        <template #footer>
            <div class="flex justify-end">
                <UButton color="neutral" label="닫기" @click="$emit('update:open', false)" />
            </div>
        </template>
    </UModal>
</template>
