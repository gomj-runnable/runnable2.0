<script setup lang="ts">
import type { FacilityType } from '#shared/types/facility'
import ChipButton from '~/components/map/molecules/buttons/ChipButton.vue'
import { FACILITY_LAYERS, OVERLAY_LAYERS } from '~/composables/store/useFacilityStore'
import { useSidewalkStore } from '~/composables/store/useSidewalkStore'

defineProps<{
    /** 현재 활성화된 시설 타입 집합 */
    activeTypes: Set<FacilityType>
    /** 시설 데이터 로딩 중 여부 */
    isLoading: boolean
}>()

defineEmits<{
    /** 칩 버튼 클릭 시 해당 시설 타입을 전달 */
    toggle: [type: FacilityType]
}>()

const sidewalk = useSidewalkStore()
</script>

<template>
    <div class="facility-overlay">
        <div class="facility-overlay__chips">
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
        <div
            v-if="sidewalk.isActive.value && sidewalk.districts.value.length > 0"
            class="facility-overlay__chips"
        >
            <ChipButton
                v-for="d in sidewalk.districts.value"
                :key="d.name"
                :label="d.name"
                size="xs"
                appearance="elevated"
                :active="sidewalk.selectedDistricts.value.has(d.name)"
                @click="sidewalk.toggleDistrict(d.name)"
            />
        </div>
    </div>
</template>

<style scoped src="~/assets/css/components/templates/FacilityOverlay.css"></style>
