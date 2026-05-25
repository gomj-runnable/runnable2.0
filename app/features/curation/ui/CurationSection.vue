<script setup lang="ts">
import type { SavedCurationCollection } from '#shared/types/curation'
import type { SavedRoute } from '#shared/types/route'

defineProps<{
    collections: SavedCurationCollection[]
    isLoadingCollections: boolean
    selectedCollectionId: string | null
    collectionRoutes: SavedRoute[]
    isLoadingRoutes: boolean
}>()

const emit = defineEmits<{
    'select-collection': [collectionId: string | null]
    'select-route': [routeId: string]
}>()

const seasonLabel: Record<string, string> = {
    spring: '봄',
    summer: '여름',
    autumn: '가을',
    winter: '겨울'
}
const themeLabel: Record<string, string> = {
    'cherry-blossom': '벚꽃',
    'autumn-leaves': '단풍',
    sunrise: '일출',
    sunset: '일몰',
    'night-view': '야경',
    shade: '그늘',
    riverside: '강변'
}
</script>

<template>
    <div v-if="collections.length > 0 || isLoadingCollections" class="flex flex-col gap-2">
        <div class="map-section-label flex items-center gap-2">
            <UIcon name="i-lucide-sparkles" class="size-4 text-(--ui-primary)" />
            큐레이션
        </div>

        <div v-if="isLoadingCollections" class="py-2 text-sm text-text-muted text-center">
            로딩 중...
        </div>

        <div v-else class="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            <button
                v-for="c in collections"
                :key="c.collectionId"
                class="shrink-0 min-w-32 max-w-40 rounded-lg border px-3 py-2 text-left text-sm transition-colors"
                :class="
                    selectedCollectionId === c.collectionId
                        ? 'border-(--ui-primary) bg-(--ui-primary)/10'
                        : 'border-(--ui-border) hover:bg-(--ui-bg-elevated)'
                "
                @click="emit('select-collection', c.collectionId)"
            >
                <div class="font-medium truncate">{{ c.title }}</div>
                <div class="text-xs text-(--ui-text-muted) mt-0.5">
                    {{ seasonLabel[c.season] ?? c.season }} · {{ themeLabel[c.theme] ?? c.theme }}
                </div>
                <div class="text-xs text-(--ui-text-dimmed) mt-0.5">경로 {{ c.routeCount }}개</div>
            </button>
        </div>

        <div v-if="selectedCollectionId" class="flex flex-col gap-1.5 mt-1">
            <div v-if="isLoadingRoutes" class="py-2 text-sm text-text-muted text-center">
                경로 불러오는 중...
            </div>
            <div
                v-else-if="collectionRoutes.length === 0"
                class="py-2 text-sm text-text-muted text-center"
            >
                컬렉션에 등록된 경로가 없습니다
            </div>
            <ul v-else class="flex flex-col gap-1.5 list-none m-0 p-0">
                <li v-for="r in collectionRoutes" :key="r.routeId">
                    <button
                        class="w-full text-left rounded-md border border-(--ui-border) px-2.5 py-1.5 text-sm hover:bg-(--ui-bg-elevated)"
                        @click="emit('select-route', r.routeId)"
                    >
                        <div class="font-medium truncate">{{ r.title }}</div>
                        <div v-if="r.authorName" class="text-xs text-(--ui-text-muted) truncate">
                            {{ r.authorName }}
                        </div>
                    </button>
                </li>
            </ul>
        </div>
    </div>
</template>
