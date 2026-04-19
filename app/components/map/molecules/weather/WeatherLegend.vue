<script setup lang="ts">
import { WeatherLayerEnum } from '#shared/types/weather-layer.enum'

const props = defineProps<{
    /** 현재 활성화된 날씨 레이어 타입 (표시할 범례 결정에 사용) */
    activeLayer: WeatherLayerEnum | null
    /** 온도 레이어 활성 시 표시할 현재 온도 값 (°C) */
    currentTemperature?: number | null
}>()

const weatherItems = [
    { label: '맑음', color: 'rgba(255, 230, 50, 0.5)' },
    { label: '구름많음', color: 'rgba(200, 185, 155, 0.5)' },
    { label: '흐림', color: 'rgba(120, 120, 160, 0.5)' },
    { label: '비', color: 'rgba(60, 150, 220, 0.5)' },
    { label: '눈', color: 'rgba(150, 210, 250, 0.6)' },
]

const pm10Items = [
    { label: '좋음 (≤30)', color: 'rgba(100, 200, 100, 0.5)' },
    { label: '보통 (≤80)', color: 'rgba(250, 220, 50, 0.5)' },
    { label: '나쁨 (≤150)', color: 'rgba(255, 150, 50, 0.5)' },
    { label: '매우나쁨 (>150)', color: 'rgba(220, 60, 60, 0.5)' },
]
</script>

<template>
    <div class="weather-legend">
        <!-- 날씨 레이어 -->
        <template v-if="activeLayer?.isWeather">
            <p class="weather-legend__title">날씨</p>
            <div class="weather-legend__list">
                <div
                    v-for="item in weatherItems"
                    :key="item.label"
                    class="weather-legend__item"
                >
                    <span class="weather-legend__swatch" :style="{ background: item.color }" />
                    {{ item.label }}
                </div>
                <div class="weather-legend__item">
                    <span class="weather-legend__swatch weather-legend__swatch--no-data" />
                    데이터 없음
                </div>
            </div>
        </template>

        <!-- 온도 레이어 -->
        <template v-else-if="activeLayer?.isTemperature">
            <p class="weather-legend__title">온도 (°C)</p>
            <div v-if="currentTemperature !== null && currentTemperature !== undefined" class="weather-legend__current-temp">
                <span class="weather-legend__temp-value">{{ currentTemperature.toFixed(1) }}°C</span>
                <span class="weather-legend__temp-label">현재</span>
            </div>
            <div class="weather-legend__gradient-bar">
                <div class="weather-legend__gradient" />
                <div class="weather-legend__gradient-labels">
                    <span>-10°</span>
                    <span>15°</span>
                    <span>40°</span>
                </div>
            </div>
            <div class="weather-legend__list" style="margin-top: var(--gap-2)">
                <div class="weather-legend__item">
                    <span class="weather-legend__swatch weather-legend__swatch--no-data" />
                    데이터 없음
                </div>
            </div>
        </template>

        <!-- 미세먼지 레이어 -->
        <template v-else-if="activeLayer?.isPm10">
            <p class="weather-legend__title">미세먼지 PM10</p>
            <div class="weather-legend__list">
                <div
                    v-for="item in pm10Items"
                    :key="item.label"
                    class="weather-legend__item"
                >
                    <span class="weather-legend__swatch" :style="{ background: item.color }" />
                    {{ item.label }}
                </div>
                <div class="weather-legend__item">
                    <span class="weather-legend__swatch weather-legend__swatch--no-data" />
                    데이터 없음
                </div>
            </div>
        </template>
    </div>
</template>

<style scoped src="~/assets/css/components/molecules/WeatherLegend.css"></style>
