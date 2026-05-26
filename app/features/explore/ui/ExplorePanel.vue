<script setup lang="ts">
import type { SavedRoute } from '#shared/types/route'
import { getRouteInfoItems } from '~/shared/lib/useRouteInfoFormat'
import { useRouteSocialActions } from '~/features/route-social/api/useRouteSocialActions'
import { useNotificationStore } from '~/entities/notification/model/useNotificationStore'
import { useRouteCompareSideeffect } from '~/features/route-compare/api/useRouteCompareSideeffect'

const props = defineProps<{
    /** 공개 경로 목록 */
    routes: SavedRoute[]
    /** 현재 선택된 경로 ID (없으면 null) */
    selectedRouteId: string | null
    /** 경로 로딩 중 여부 */
    isLoading: boolean
    /** 현재 로그인 사용자 ID (좋아요/소유권 판별용) */
    currentUserId?: string | null
}>()

defineEmits<{
    /** 경로 카드 클릭 시 선택된 경로 ID를 전달 */
    select: [routeId: string]
    /** 경로 가져오기 버튼 클릭 시 경로 ID를 전달 */
    import: [routeId: string]
}>()

const social = useRouteSocialActions(useNotificationStore())
const compareEffect = useRouteCompareSideeffect()
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
        <div class="map-section-label">공개 경로</div>

        <template>
            <div v-if="isLoading" class="py-4 text-sm text-text-muted text-center">검색 중...</div>

            <div v-else-if="routes.length === 0" class="py-4 text-sm text-text-muted text-center">
                검색 결과가 없습니다
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
                                    <div class="flex items-center justify-between gap-2">
                                        <p
                                            class="font-semibold text-[var(--ui-text-highlighted)] truncate"
                                        >
                                            {{ route.title }}
                                        </p>
                                        <span
                                            v-if="route.authorName"
                                            class="shrink-0 text-xs font-medium text-[var(--ui-text-muted)] whitespace-nowrap"
                                        >
                                            {{ route.authorName }}
                                        </span>
                                    </div>
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
                                    icon="i-lucide-folder-input"
                                    variant="outline"
                                    color="neutral"
                                    size="sm"
                                    label="경로 가져오기"
                                    @click.stop="$emit('import', route.routeId)"
                                />
                                <UButton
                                    variant="outline"
                                    color="neutral"
                                    size="sm"
                                    icon="i-lucide-share-2"
                                    label="공유 링크"
                                    @click.stop="social.copyShareLink(route.routeId)"
                                />
                                <UButton
                                    v-if="currentUserId && !isOwner(route.userId)"
                                    :variant="social.isLiked(route.routeId) ? 'solid' : 'outline'"
                                    :color="social.isLiked(route.routeId) ? 'primary' : 'neutral'"
                                    size="sm"
                                    icon="i-lucide-heart"
                                    :label="`${social.displayLikeCount(route.routeId, route.likeCount ?? 0)}`"
                                    @click.stop="
                                        social.toggleLike(route.routeId, route.likeCount ?? 0)
                                    "
                                />
                                <UButton
                                    :variant="
                                        compareEffect.pendingRouteId.value === route.routeId
                                            ? 'solid'
                                            : 'outline'
                                    "
                                    :color="
                                        compareEffect.pendingRouteId.value === route.routeId
                                            ? 'primary'
                                            : 'neutral'
                                    "
                                    size="sm"
                                    icon="i-lucide-git-compare"
                                    :label="
                                        compareEffect.pendingRouteId.value === route.routeId
                                            ? '비교 대상 선택…'
                                            : '비교'
                                    "
                                    @click.stop="compareEffect.pickRoute(route.routeId)"
                                />
                            </div>
                        </template>
                    </UCard>
                </li>
            </ul>
        </template>
    </div>
</template>
