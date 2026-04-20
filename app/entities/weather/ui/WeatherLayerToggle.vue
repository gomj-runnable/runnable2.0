<script setup lang="ts">
import { WeatherLayerEnum } from '#shared/types/weather-layer.enum'
import ChipButton from '~/shared/ui/buttons/ChipButton.vue'

const props = defineProps<{
    /** 현재 활성화된 날씨 레이어 타입 */
    modelValue: WeatherLayerEnum | null
}>()

/** 날씨 레이어 변경 이벤트 */
const emit = defineEmits<{
    'update:modelValue': [value: WeatherLayerEnum | null]
}>()

const layers: { value: WeatherLayerEnum; label: string; icon: string }[] = [
    { value: WeatherLayerEnum.WEATHER, label: '날씨', icon: 'i-lucide-cloud-sun' },
    { value: WeatherLayerEnum.TEMPERATURE, label: '온도', icon: 'i-lucide-thermometer' },
    { value: WeatherLayerEnum.PM10, label: '미세먼지', icon: 'i-lucide-wind' }
]

const handleClick = (layer: WeatherLayerEnum) => {
    emit('update:modelValue', props.modelValue?.equals(layer) ? null : layer)
}
</script>

<template>
    <div class="weather-layer-toggle">
        <ChipButton
            v-for="layer in layers"
            :key="layer.value.key"
            :label="layer.label"
            :icon="layer.icon"
            size="sm"
            appearance="elevated"
            :active="modelValue?.equals(layer.value) ?? false"
            @click="handleClick(layer.value)"
        />
    </div>
</template>

<style scoped src="./WeatherLayerToggle.css"></style>
