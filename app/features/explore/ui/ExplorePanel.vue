<script setup lang="ts">
import type { SavedRoute } from '#shared/types/route'
import { getRouteInfoItems } from '~/shared/lib/useRouteInfoFormat'

defineProps<{
    /** 공개 경로 목록 */
    routes: SavedRoute[]
    /** 현재 선택된 경로 ID (없으면 null) */
    selectedRouteId: string | null
    /** 경로 로딩 중 여부 */
    isLoading: boolean
    /** 추천 모드 활성 여부 */
    recommendActive?: boolean
}>()

defineEmits<{
    /** 경로 카드 클릭 시 선택된 경로 ID를 전달 */
    select: [routeId: string]
    /** 추천 모드 토글 */
    recommend: []
}>()
</script>

<template>
    <div class="flex flex-col gap-3 w-full">
        <div class="flex items-center justify-between">
            <div class="map-section-label">공개 경로</div>
            <UButton
                label="추천"
                icon="i-lucide-cloud-sun"
                size="sm"
                :variant="recommendActive ? 'solid' : 'outline'"
                :color="recommendActive ? 'primary' : 'neutral'"
                @click="$emit('recommend')"
            />
        </div>

        <template v-if="recommendActive">
            <slot name="recommend" />
        </template>

        <template v-else>
            <div v-if="isLoading" class="py-4 text-sm text-text-muted text-center">검색 중...</div>

            <div v-else-if="routes.length === 0" class="py-4 text-sm text-text-muted text-center">
                검색 결과가 없습니다
            </div>

            <ul v-else class="flex flex-col gap-2.5 list-none m-0 p-0">
                <li v-for="route in routes" :key="route.routeId">
                    <UCard
                        variant="subtle"
                        :title="route.title"
                        :description="route.description"
                        class="cursor-pointer"
                        :class="{ 'ring-2 ring-[var(--ui-primary)]': selectedRouteId === route.routeId }"
                        @click="$emit('select', route.routeId)"
                    >
                        <template #header>
                            <div class="flex items-start justify-between gap-2">
                                <div>
                                    <p class="text-lg font-semibold text-[var(--ui-text-highlighted)]">{{ route.title }}</p>
                                    <p v-if="route.description" class="mt-1 text-sm text-[var(--ui-text-muted)]">{{ route.description }}</p>
                                </div>
                                <span
                                    v-if="route.authorName"
                                    class="shrink-0 text-xs font-medium text-[var(--ui-text-muted)] whitespace-nowrap"
                                >
                                    {{ route.authorName }}
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
                </li>
            </ul>
        </template>
    </div>
</template>
