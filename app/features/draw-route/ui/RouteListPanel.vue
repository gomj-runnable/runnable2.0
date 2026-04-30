<script setup lang="ts">
import type { SavedRoute } from '#shared/types/route'
import Card from '~/shared/ui/cards/Card.vue'
import { formatDistance } from '~/shared/lib/useFormatUtils'

defineProps<{
    /** 저장된 경로 목록 */
    routes: SavedRoute[]
    /** 현재 선택된 경로 ID (없으면 null) */
    selectedRouteId: string | null
}>()

defineEmits<{
    /** 경로 카드 클릭 시 선택된 경로 ID를 전달 */
    select: [routeId: string]
    /** 다운로드 버튼 클릭 시 해당 경로 ID를 전달 */
    download: [routeId: string]
}>()
</script>

<template>
    <div class="flex flex-col gap-3 w-full">
        <div class="map-section-label">저장된 경로</div>

        <div v-if="routes.length === 0" class="py-4 text-sm text-text-muted text-center">저장된 경로가 없습니다</div>

        <ul v-else class="flex flex-col gap-2.5 list-none m-0 p-0">
            <li v-for="route in routes" :key="route.routeId">
                <Card
                    interactive
                    :selected="selectedRouteId === route.routeId"
                    as="article"
                    @click="$emit('select', route.routeId)"
                >
                    <template #header>
                        <div class="flex items-start justify-between gap-2.5">
                            <h3 class="m-0 text-lg font-bold leading-[1.2] tracking-[-0.02em] text-text-base">
                                {{ route.title }}
                            </h3>
                            <UButton
                                variant="outline"
                                color="neutral"
                                icon="i-lucide-download"
                                label="경로 다운로드"
                                @click.stop="$emit('download', route.routeId)"
                            />
                        </div>
                    </template>

                    <p v-if="route.description" class="m-0 text-sm leading-[1.5] text-text-muted">
                        {{ route.description }}
                    </p>

                    <template #meta>
                        <div class="flex items-center gap-2.5">
                            <span class="text-[0.8125rem] font-medium leading-[1.4] text-text-dimmed">
                                {{ formatDistance(route.distance) }}
                            </span>
                            <span v-if="route.sgg?.length" class="text-xs font-medium text-text-muted">
                                {{ route.sgg.join(' · ') }}
                            </span>
                        </div>
                    </template>
                </Card>
            </li>
        </ul>
    </div>
</template>
