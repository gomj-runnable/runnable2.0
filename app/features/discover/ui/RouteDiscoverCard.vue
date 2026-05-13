<script setup lang="ts">
import type { RouteDiscoverCard } from '#shared/types/discover'
import { getRouteInfoItems as getBaseRouteInfoItems } from '~/shared/lib/useRouteInfoFormat'

const props = defineProps<{
    /** 경로 카드 데이터 */
    route: RouteDiscoverCard
    /** 선택 상태 여부 */
    selected?: boolean
}>()

const emit = defineEmits<{
    /** 카드 클릭 시 경로 ID를 전달 */
    select: [routeId: string]
    /** 좋아요 토글 시 경로 ID와 새 상태를 전달 */
    like: [routeId: string, liked: boolean]
}>()

const isLiked = ref(props.route.likedByMe ?? false)
const likeCount = ref(props.route.likeCount ?? 0)
const isLiking = ref(false)

function getRouteInfoItems(route: RouteDiscoverCard) {
    const items = getBaseRouteInfoItems(route)
    if (route.authorName) items.push({ key: '작성자', value: route.authorName })
    return items
}

async function toggleLike(e: Event) {
    e.stopPropagation()
    if (isLiking.value) return
    isLiking.value = true
    try {
        if (isLiked.value) {
            await $fetch(`/api/routes/${props.route.routeId}/like`, { method: 'DELETE' })
            isLiked.value = false
            likeCount.value = Math.max(0, likeCount.value - 1)
        } else {
            await $fetch(`/api/routes/${props.route.routeId}/like`, { method: 'POST' })
            isLiked.value = true
            likeCount.value += 1
        }
        emit('like', props.route.routeId, isLiked.value)
    } catch {
        // optimistic update 실패 시 원래 값 복구
        isLiked.value = props.route.likedByMe ?? false
        likeCount.value = props.route.likeCount ?? 0
    } finally {
        isLiking.value = false
    }
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

        <template #footer>
            <div class="flex items-center justify-between text-xs text-[var(--ui-text-muted)]">
                <span v-if="route.viewCount !== undefined">조회 {{ route.viewCount }}</span>
                <button
                    class="flex items-center gap-1 transition-colors"
                    :class="isLiked ? 'text-red-500' : 'hover:text-red-400'"
                    :disabled="isLiking"
                    @click="toggleLike"
                    @keydown.enter.stop="toggleLike"
                >
                    <UIcon :name="isLiked ? 'i-heroicons-heart-solid' : 'i-heroicons-heart'" />
                    <span>{{ likeCount }}</span>
                </button>
            </div>
        </template>
    </UCard>
</template>
