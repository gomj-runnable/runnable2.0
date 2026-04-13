<script setup lang="ts">
import type { FacilityType } from '#shared/types/facility'
import ChipButton from '~/components/map/molecules/buttons/ChipButton.vue'
import { FACILITY_LAYERS, OVERLAY_LAYERS } from '~/composables/store/useFacilityStore'
import { useSidewalkStore } from '~/composables/store/useSidewalkStore'
import { useCameraStore } from '~/composables/store/useCameraStore'

/** POI 검색 대상 유형 (현재 위치 검색 버튼 표시 기준) */
const SEARCHABLE_TYPES: FacilityType[] = ['crosswalk', 'fountain', 'hospital']

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
const camera = useCameraStore()

/** crosswalk / fountain / hospital 중 하나라도 활성화되어 있으면 검색 버튼 표시 */
const hasSearchableActive = computed(() =>
    SEARCHABLE_TYPES.some((t) => props.activeTypes.has(t))
)

const districtOptions = computed(() =>
    sidewalk.districts.value.map((d) => ({ label: d.name, value: d.name }))
)

const selectedDistrict = computed({
    get: () => sidewalk.selectedDistrict.value,
    set: (value: string | null) => sidewalk.selectDistrict(value ?? '')
})

watch(
    () => sidewalk.isActive.value,
    (active) => {
        if (active && sidewalk.selectedDistrict.value === null && camera.locationLabel.value) {
            sidewalk.setDistrictFromLocation(camera.locationLabel.value)
        }
    }
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
                :active="activeTypes.has(layer.type)"
                @click="$emit('toggle', layer.type)"
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
            <USelect
                v-if="sidewalk.isActive.value && sidewalk.districts.value.length > 0"
                v-model="selectedDistrict"
                :items="districtOptions"
                placeholder="시군구 선택"
                size="sm"
                class="facility-overlay__select"
            />
            <ChipButton
                v-for="layer in OVERLAY_LAYERS"
                :key="layer.type"
                :label="layer.label"
                :icon="layer.icon"
                size="sm"
                appearance="elevated"
                :active="sidewalk.isActive.value"
                @click="sidewalk.isActive.value = !sidewalk.isActive.value"
            >
                <template #leading>
                    <span
                        class="facility-overlay__chip-dot"
                        :style="{ backgroundColor: layer.color }"
                    />
                </template>
            </ChipButton>
        </div>
    </div>
</template>

<style scoped src="~/assets/css/components/templates/FacilityOverlay.css"></style>
