<script setup lang="ts">
import type { WeatherLayer } from '#shared/types/weather'
import ChipButton from '~/components/map/molecules/buttons/ChipButton.vue'

const props = defineProps<{
    /** 현재 활성화된 날씨 레이어 타입 */
    modelValue: WeatherLayer
}>()

/** 날씨 레이어 변경 이벤트 */
const emit = defineEmits<{
    'update:modelValue': [value: WeatherLayer]
}>()

const layers: { value: WeatherLayer; label: string; icon: string }[] = [
    { value: 'weather', label: '날씨', icon: 'i-lucide-cloud-sun' },
    { value: 'temperature', label: '온도', icon: 'i-lucide-thermometer' },
    { value: 'pm10', label: '미세먼지', icon: 'i-lucide-wind' },
]
</script>

<template>
    <div class="weather-layer-toggle">
        <ChipButton
            v-for="layer in layers"
            :key="layer.value"
            :label="layer.label"
            :icon="layer.icon"
            size="sm"
            appearance="elevated"
            :active="modelValue === layer.value"
            @click="emit('update:modelValue', layer.value)"
        />
    </div>
</template>

<style scoped src="~/assets/css/components/molecules/WeatherLayerToggle.css"></style>
