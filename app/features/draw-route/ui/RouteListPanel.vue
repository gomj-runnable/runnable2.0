<script setup lang="ts">
import type { SavedRoute } from '#shared/types/route'
import { getRouteInfoItems } from '~/shared/lib/useRouteInfoFormat'
import { useRouteSocialActions } from '~/features/route-social/api/useRouteSocialActions'
import { useNotificationStore } from '~/entities/notification/model/useNotificationStore'

const props = defineProps<{
    /** 저장된 경로 목록 */
    routes: SavedRoute[]
    /** 현재 선택된 경로 ID (없으면 null) */
    selectedRouteId: string | null
    /** 현재 로그인 사용자 ID (소유권 판별용) */
    currentUserId?: string | null
}>()

defineEmits<{
    /** 경로 카드 클릭 시 선택된 경로 ID를 전달 */
    select: [routeId: string]
    /** 다운로드 버튼 클릭 시 해당 경로 ID를 전달 */
    download: [routeId: string]
    /** 수정 버튼 클릭 시 해당 경로 ID를 전달 */
    edit: [routeId: string]
}>()

const social = useRouteSocialActions(useNotificationStore())
const isOwner = (userId?: string) => !!props.currentUserId && userId === props.currentUserId

/** 펼쳐진 카드의 routeId Set */
const expandedIds = ref<Set<string>>(new Set())

function toggleExpand(routeId: string) {
    if (expandedIds.value.has(routeId)) {
        expandedIds.value.delete(routeId)
    } else {
        expandedIds.value.add(routeId)
    }
}
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
                    class="cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--ui-primary)]"
                    :class="{
                        'ring-2 ring-[var(--ui-primary)]': selectedRouteId === route.routeId
                    }"
                    tabindex="0"
                    role="button"
                    @click="$emit('select', route.routeId)"
                    @keydown.enter="$emit('select', route.routeId)"
                >
                    <template #header>
                        <div class="flex items-center gap-2">
                            <div class="min-w-0 flex-1">
                                <p class="font-semibold text-[var(--ui-text-highlighted)] truncate">
                                    {{ route.title }}
                                </p>
                                <p
                                    class="text-sm mt-0.5 line-clamp-1"
                                    :class="
                                        route.description
                                            ? 'text-[var(--ui-text-muted)]'
                                            : 'text-[var(--ui-text-dimmed)] italic'
                                    "
                                >
                                    {{ route.description || '설명이 없습니다.' }}
                                </p>
                            </div>
                            <UButton
                                :icon="
                                    expandedIds.has(route.routeId)
                                        ? 'i-lucide-chevron-up'
                                        : 'i-lucide-chevron-down'
                                "
                                variant="ghost"
                                color="neutral"
                                size="sm"
                                square
                                aria-label="상세 정보 토글"
                                @click.stop="toggleExpand(route.routeId)"
                            />
                        </div>
                    </template>

                    <template v-if="expandedIds.has(route.routeId)" #default>
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
                    </template>

                    <template v-if="expandedIds.has(route.routeId)" #footer>
                        <div class="flex items-center gap-2 flex-wrap">
                            <UButton
                                variant="outline"
                                color="neutral"
                                size="sm"
                                icon="i-lucide-download"
                                label="경로 다운로드"
                                @click.stop="$emit('download', route.routeId)"
                            />
                            <UButton
                                v-if="isOwner(route.userId)"
                                variant="outline"
                                color="primary"
                                size="sm"
                                icon="i-lucide-pencil"
                                label="수정"
                                @click.stop="$emit('edit', route.routeId)"
                            />
                            <UButton
                                v-if="route.isPublic"
                                variant="outline"
                                color="neutral"
                                size="sm"
                                icon="i-lucide-share-2"
                                label="공유 링크"
                                @click.stop="social.copyShareLink(route.routeId)"
                            />
                            <UButton
                                v-if="route.isPublic && currentUserId && !isOwner(route.userId)"
                                :variant="social.isLiked(route.routeId) ? 'solid' : 'outline'"
                                :color="social.isLiked(route.routeId) ? 'primary' : 'neutral'"
                                size="sm"
                                :icon="
                                    social.isLiked(route.routeId)
                                        ? 'i-lucide-heart'
                                        : 'i-lucide-heart'
                                "
                                :label="`${social.displayLikeCount(route.routeId, route.likeCount ?? 0)}`"
                                @click.stop="social.toggleLike(route.routeId, route.likeCount ?? 0)"
                            />
                        </div>
                    </template>
                </UCard>
            </li>
        </ul>
    </div>
</template>
