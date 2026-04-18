<script setup lang="ts">
import { useDistrictStore } from '~/composables/store/useDistrictStore'

const { guNames } = useDistrictStore()

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
                v-for="district in guNames"
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
