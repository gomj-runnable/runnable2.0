<script setup lang="ts">
import type { SavedRoute } from '#shared/types/route'
import { getRouteInfoItems } from '~/shared/lib/useRouteInfoFormat'

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

        <div v-if="routes.length === 0" class="py-4 text-sm text-text-muted text-center">
            저장된 경로가 없습니다
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

                    <template #footer>
                        <div class="flex items-center gap-2">
                            <UButton
                                variant="outline"
                                color="neutral"
                                size="sm"
                                icon="i-lucide-download"
                                label="경로 다운로드"
                                @click.stop="$emit('download', route.routeId)"
                            />
                        </div>
                    </template>
                </UCard>
            </li>
        </ul>
    </div>
</template>
