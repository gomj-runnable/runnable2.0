<script setup lang="ts">
/**
 * 탐색(explore) 사이드패널 플러그인 콘텐츠.
 * 검색 입력 + 시군구/읍면동 필터 + 공개 경로 목록을 자체적으로 구성한다.
 * 경로 선택/가져오기는 전역 useMapActions를 통해 코어 facade로 위임한다.
 * (USlideover chrome은 PluginSurfaceHost가 제공하므로 콘텐츠만 렌더한다.)
 */
import ExplorePanel from '~/features/explore/ui/ExplorePanel.vue'
import { useExploreSearchSideeffect } from '~/features/explore/api/useExploreSearchSideeffect'
import { FILTER_ALL } from '~/features/explore/model/useExploreFilterStore'
import { useDistrictStore } from '~/entities/boundary/model/useDistrictStore'
import { useAuthStore } from '~/entities/user/model/useAuthStore'
import { useMapActions } from '~/shared/lib/map/useMapActions'

const explore = useExploreSearchSideeffect()
const districtStore = useDistrictStore()
const authStore = useAuthStore()
const { exploreSelectRoute, exploreImportRoute } = useMapActions()

/** 시군구 Select 옵션 */
const sigunguOptions = computed(() => [FILTER_ALL, ...districtStore.guNames.value])

/** 읍면동 Select 옵션 (선택된 시군구에 따라 동적 변경) */
const dongOptions = computed(() => {
    if (explore.filter.selectedSigungu.value === FILTER_ALL) return [FILTER_ALL]
    return [FILTER_ALL, ...districtStore.getDongList(explore.filter.selectedSigungu.value)]
})

/** 패널 진입 시 결과가 비어 있으면 공개 경로를 자동 로드한다. */
onMounted(() => {
    if (explore.searchResults.value.length === 0 && !explore.isSearching.value) {
        explore.search(explore.searchQuery.value)
    }
})

/** 패널이 닫히면 선택을 해제해 미리보기 오버레이가 잔존하지 않도록 한다. */
onBeforeUnmount(() => {
    explore.selectedRouteId.value = null
})

const handleSelect = (routeId: string) => {
    explore.selectRoute(routeId)
    exploreSelectRoute(routeId)
}
</script>

<template>
    <div class="flex flex-col gap-1">
        <UInput
            v-model="explore.searchQuery.value"
            type="search"
            placeholder="경로 이름으로 검색"
            icon="i-lucide-search"
            @keyup.enter="explore.search(explore.searchQuery.value)"
        />
        <div class="flex items-center gap-1">
            <USelect
                :model-value="explore.filter.selectedSigungu.value"
                :items="sigunguOptions"
                placeholder="시군구"
                class="flex-1 min-w-0"
                @update:model-value="explore.filter.setSigungu($event)"
            />
            <USelect
                :model-value="explore.filter.selectedDong.value"
                :items="dongOptions"
                placeholder="읍면동"
                class="flex-1 min-w-0"
                :disabled="explore.filter.selectedSigungu.value === FILTER_ALL"
                @update:model-value="explore.filter.selectedDong.value = $event"
            />
            <UButton
                variant="outline"
                color="neutral"
                size="sm"
                icon="i-lucide-rotate-ccw"
                label="초기화"
                @click="explore.filter.resetFilters()"
            />
        </div>
        <ExplorePanel
            :routes="explore.filteredResults.value"
            :selected-route-id="explore.selectedRouteId.value"
            :is-loading="explore.isSearching.value"
            :current-user-id="authStore.user.value?.id"
            @select="handleSelect"
            @import="exploreImportRoute"
        />
    </div>
</template>
