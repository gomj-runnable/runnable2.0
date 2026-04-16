<script setup lang="ts">
/** 서울 25개 자치구 목록 */
const DISTRICTS = [
    '강남구', '강동구', '강북구', '강서구', '관악구',
    '광진구', '구로구', '금천구', '노원구', '도봉구',
    '동대문구', '동작구', '마포구', '서대문구', '서초구',
    '성동구', '성북구', '송파구', '양천구', '영등포구',
    '용산구', '은평구', '종로구', '중구', '중랑구'
] as const

defineProps<{
    /** 현재 선택된 구 이름. 선택 없음이면 `null`. */
    modelValue: string | null
}>()

defineEmits<{
    /** 구 선택 시 선택된 구 이름을 전달. 이미 선택된 구 클릭 시 `null` 전달. */
    'update:modelValue': [district: string | null]
}>()
</script>

<template>
    <div class="discover-district-selector">
        <div class="map-section-label">구역 선택</div>
        <div class="discover-district-selector__grid">
            <button
                v-for="district in DISTRICTS"
                :key="district"
                class="discover-district-selector__chip"
                :class="{ 'is-active': modelValue === district }"
                type="button"
                @click="$emit('update:modelValue', modelValue === district ? null : district)"
            >
                {{ district }}
            </button>
        </div>
    </div>
</template>

<style scoped src="~/assets/css/components/molecules/DiscoverDistrictSelector.css"></style>
