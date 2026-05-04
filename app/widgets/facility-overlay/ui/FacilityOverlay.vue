<script setup lang="ts">
import type { FacilityType } from '#shared/types/facility'
import { FACILITY_LAYERS } from '~/entities/facility/model/useFacilityStore'
import { useSidewalkStore } from '~/entities/facility/model/useSidewalkStore'
import { useBoundaryStore } from '~/entities/boundary/model/useBoundaryStore'
import { useElevationLayerStore } from '~/features/elevation-layer/model/useElevationLayerStore'
import { useRouteInfoStore } from '~/entities/route/model/useRouteInfoStore'

/** POI 검색 대상 유형 (현재 위치 검색 버튼 표시 기준) */
const SEARCHABLE_TYPES: FacilityType[] = ['crosswalk', 'fountain', 'hospital', 'sidewalk']

const props = defineProps<{
    /** 현재 활성화된 시설 타입 집합 */
    activeTypes: Set<FacilityType>
    /** 시설 데이터 로딩 중 여부 */
    isLoading: boolean
    /** 현재 위치 기반 POI 검색 진행 중 여부 */
    isSearching: boolean
    /** 뷰어 미준비 시 칩 비활성화 */
    disabled?: boolean
    /** 시뮬레이션 칩 표시 여부 */
    showSimulation?: boolean
    /** 시뮬레이션 Drawer 열림 여부 */
    simulationActive?: boolean
    /** 경로정보 칩 표시 여부 */
    showRouteInfo?: boolean
}>()

defineEmits<{
    /** 칩 버튼 클릭 시 해당 시설 타입을 전달 */
    toggle: [type: FacilityType]
    /** 현재 위치 기반 POI 검색 요청 */
    searchNearby: []
    /** 시뮬레이션 칩 클릭 */
    toggleSimulation: []
}>()

const sidewalk = useSidewalkStore()
const boundary = useBoundaryStore()
const elevation = useElevationLayerStore()
const routeInfoStore = useRouteInfoStore()

/** crosswalk / fountain / hospital / sidewalk 중 하나라도 활성화되어 있으면 검색 버튼 표시 */
const hasSearchableActive = computed(() =>
    SEARCHABLE_TYPES.some(
        (t) => props.activeTypes.has(t) || (t === 'sidewalk' && sidewalk.isActive.value)
    )
)
</script>

<template>
    <div class="absolute top-4 right-4 hidden md:flex flex-col gap-1 pointer-events-auto z-[12]">
        <div class="flex gap-1 flex-wrap justify-end">
            <UButton
                v-if="hasSearchableActive"
                label="현재 위치 검색"
                icon="i-lucide-locate"
                size="sm"
                class="font-bold rounded-full"
                variant="subtle"
                color="primary"
                :disabled="isSearching"
                @click="$emit('searchNearby')"
            />
            <UButton
                v-for="layer in FACILITY_LAYERS"
                :key="layer.type"
                :label="layer.label"
                :icon="layer.icon"
                size="sm"
                class="font-bold rounded-full"
                :disabled="disabled"
                :loading="
                    isLoading &&
                    (layer.type === 'sidewalk'
                        ? sidewalk.isActive.value
                        : activeTypes.has(layer.type))
                "
                :variant="
                    (
                        layer.type === 'sidewalk'
                            ? sidewalk.isActive.value
                            : activeTypes.has(layer.type)
                    )
                        ? 'solid'
                        : 'outline'
                "
                :color="
                    (
                        layer.type === 'sidewalk'
                            ? sidewalk.isActive.value
                            : activeTypes.has(layer.type)
                    )
                        ? 'primary'
                        : 'neutral'
                "
                @click="
                    layer.type === 'sidewalk'
                        ? (sidewalk.isActive.value = !sidewalk.isActive.value)
                        : $emit('toggle', layer.type)
                "
            >
                <template #leading>
                    <span
                        class="w-2 h-2 rounded-full shrink-0"
                        :style="{ backgroundColor: layer.color }"
                    />
                </template>
            </UButton>
        </div>
        <div class="flex gap-1 flex-wrap justify-end">
            <UButton
                label="지역 고도"
                icon="i-lucide-mountain"
                size="sm"
                class="font-bold rounded-full"
                :variant="elevation.isElevationVisible.value ? 'solid' : 'outline'"
                :color="elevation.isElevationVisible.value ? 'primary' : 'neutral'"
                @click="elevation.toggleElevation"
            />
            <UButton
                label="시군구"
                icon="i-lucide-map"
                size="sm"
                class="font-bold rounded-full"
                :variant="boundary.isGuActive.value ? 'solid' : 'outline'"
                :color="boundary.isGuActive.value ? 'primary' : 'neutral'"
                @click="boundary.toggleGu"
            />
            <UButton
                label="읍면동"
                icon="i-lucide-map-pin"
                size="sm"
                class="font-bold rounded-full"
                :variant="boundary.isDongActive.value ? 'solid' : 'outline'"
                :color="boundary.isDongActive.value ? 'primary' : 'neutral'"
                @click="boundary.toggleDong"
            />
        </div>
        <div class="flex gap-1 flex-wrap justify-end">
            <UButton
                v-if="showSimulation"
                label="시뮬레이션"
                icon="i-lucide-play-circle"
                size="sm"
                class="font-bold rounded-full"
                :variant="simulationActive ? 'solid' : 'outline'"
                :color="simulationActive ? 'primary' : 'neutral'"
                @click="$emit('toggleSimulation')"
            />
            <UButton
                v-if="showRouteInfo"
                label="경로정보"
                icon="i-lucide-message-circle"
                size="sm"
                class="font-bold rounded-full"
                :variant="routeInfoStore.isAddingRouteInfo.value ? 'solid' : 'outline'"
                :color="routeInfoStore.isAddingRouteInfo.value ? 'primary' : 'neutral'"
                @click="routeInfoStore.toggleAddingMode()"
            />
        </div>
    </div>
</template>
