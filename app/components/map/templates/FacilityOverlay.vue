<script setup lang="ts">
import type { FacilityType } from '#shared/types/facility'
import ChipButton from '~/components/map/molecules/buttons/ChipButton.vue'
import { FACILITY_LAYERS } from '~/composables/store/useFacilityStore'
import { useSidewalkStore } from '~/composables/store/useSidewalkStore'
import { useBoundaryStore } from '~/composables/store/useBoundaryStore'

/** POI 검색 대상 유형 (현재 위치 검색 버튼 표시 기준) */
const SEARCHABLE_TYPES: FacilityType[] = ['crosswalk', 'fountain', 'hospital', 'sidewalk']

const props = defineProps<{
    /** 현재 활성화된 시설 타입 집합 */
    activeTypes: Set<FacilityType>
    /** 시설 데이터 로딩 중 여부 */
    isLoading: boolean
    /** 현재 위치 기반 POI 검색 진행 중 여부 */
    isSearching: boolean
}>()

defineEmits<{
    /** 칩 버튼 클릭 시 해당 시설 타입을 전달 */
    toggle: [type: FacilityType]
    /** 현재 위치 기반 POI 검색 요청 */
    searchNearby: []
}>()

const sidewalk = useSidewalkStore()
const boundary = useBoundaryStore()

/** crosswalk / fountain / hospital / sidewalk 중 하나라도 활성화되어 있으면 검색 버튼 표시 */
const hasSearchableActive = computed(() =>
    SEARCHABLE_TYPES.some(
        (t) => props.activeTypes.has(t) || (t === 'sidewalk' && sidewalk.isActive.value)
    )
)
</script>

<template>
    <div class="facility-overlay">
        <div class="facility-overlay__chips">
            <ChipButton
                v-if="hasSearchableActive"
                label="현재 위치 검색"
                icon="i-lucide-locate"
                size="sm"
                appearance="tinted"
                :disabled="isSearching"
                @click="$emit('searchNearby')"
            />
            <ChipButton
                v-for="layer in FACILITY_LAYERS"
                :key="layer.type"
                :label="layer.label"
                :icon="layer.icon"
                size="sm"
                appearance="elevated"
                :active="
                    layer.type === 'sidewalk'
                        ? sidewalk.isActive.value
                        : activeTypes.has(layer.type)
                "
                @click="
                    layer.type === 'sidewalk'
                        ? (sidewalk.isActive.value = !sidewalk.isActive.value)
                        : $emit('toggle', layer.type)
                "
            >
                <template #leading>
                    <span
                        class="facility-overlay__chip-dot"
                        :style="{ backgroundColor: layer.color }"
                    />
                </template>
            </ChipButton>
        </div>
        <div class="facility-overlay__chips">
            <ChipButton
                label="시군구"
                icon="i-lucide-map"
                size="sm"
                appearance="elevated"
                :active="boundary.isGuActive.value"
                @click="boundary.toggleGu"
            />
            <ChipButton
                label="읍면동"
                icon="i-lucide-map-pin"
                size="sm"
                appearance="elevated"
                :active="boundary.isDongActive.value"
                @click="boundary.toggleDong"
            />
        </div>
    </div>
</template>

<style scoped src="~/assets/css/components/templates/FacilityOverlay.css"></style>
