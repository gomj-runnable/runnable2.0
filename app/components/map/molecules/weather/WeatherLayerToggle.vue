<script setup lang="ts">
import type { WeatherLayer } from '#shared/types/weather'

const props = defineProps<{
    modelValue: WeatherLayer
}>()

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
        <button
            v-for="layer in layers"
            :key="layer.value"
            class="weather-layer-toggle__btn"
            :class="{ 'is-active': modelValue === layer.value }"
            @click="emit('update:modelValue', layer.value)"
        >
            <span :class="layer.icon" class="weather-layer-toggle__icon" />
            <span class="weather-layer-toggle__label">{{ layer.label }}</span>
        </button>
    </div>
</template>

<style scoped src="~/assets/css/components/molecules/WeatherLayerToggle.css"></style>
