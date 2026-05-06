<script setup lang="ts">
import type { WeatherLayerEnum } from '#shared/types/weather-layer.enum'

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
    { label: '눈', color: 'rgba(150, 210, 250, 0.6)' }
]

const dustItems = [
    { label: '좋음', color: 'rgba(100, 200, 100, 0.5)', pm10: '≤30', pm25: '≤15' },
    { label: '보통', color: 'rgba(250, 220, 50, 0.5)', pm10: '≤80', pm25: '≤35' },
    { label: '나쁨', color: 'rgba(255, 150, 50, 0.5)', pm10: '≤150', pm25: '≤75' },
    { label: '매우나쁨', color: 'rgba(220, 60, 60, 0.5)', pm10: '>150', pm25: '>75' }
]
</script>

<template>
    <div
        class="bg-(--ui-bg-elevated)/85 border border-(--ui-border) rounded-2xl px-2.5 py-1.5 backdrop-blur-sm shadow-lg min-w-[140px] max-md:scale-90 max-md:origin-bottom-left max-md:max-w-[160px]"
    >
        <!-- 예보 레이어 -->
        <template v-if="activeLayer?.isWeather">
            <p class="text-xs text-meta mb-1.5 font-semibold tracking-[0.04em] uppercase">예보</p>
            <div class="flex flex-col gap-1">
                <div
                    v-for="item in weatherItems"
                    :key="item.label"
                    class="flex items-center gap-1.5 text-xs text-text-muted"
                >
                    <span
                        class="w-3 h-3 rounded-lg border border-(--ui-border) shrink-0"
                        :style="{ background: item.color }"
                    />
                    {{ item.label }}
                </div>
                <div class="flex items-center gap-1.5 text-xs text-text-muted">
                    <span
                        class="w-3 h-3 rounded-lg border border-dashed border-(--ui-border) shrink-0 bg-[rgba(80,80,80,0.3)]"
                    />
                    데이터 없음
                </div>
            </div>
        </template>

        <!-- 온도 레이어 -->
        <template v-else-if="activeLayer?.isTemperature">
            <p class="text-xs text-meta mb-1.5 font-semibold tracking-[0.04em] uppercase">
                온도 (°C)
            </p>
            <div
                v-if="currentTemperature !== null && currentTemperature !== undefined"
                class="flex items-baseline gap-1.5 mb-1.5"
            >
                <span class="text-xl font-bold text-text-base leading-none"
                    >{{ currentTemperature.toFixed(1) }}°C</span
                >
                <span class="text-xs text-meta">현재</span>
            </div>
            <div class="flex flex-col gap-1">
                <div
                    class="h-[10px] rounded-lg bg-[linear-gradient(to_right,rgba(30,80,250,0.6),rgba(80,80,250,0.55),rgba(80,200,100,0.55),rgba(250,150,50,0.55),rgba(250,60,60,0.6))] border border-(--ui-border)"
                />
                <div class="flex justify-between text-xs text-meta">
                    <span>-10°</span>
                    <span>15°</span>
                    <span>40°</span>
                </div>
            </div>
            <div class="flex flex-col gap-1 mt-1.5">
                <div class="flex items-center gap-1.5 text-xs text-text-muted">
                    <span
                        class="w-3 h-3 rounded-lg border border-dashed border-(--ui-border) shrink-0 bg-[rgba(80,80,80,0.3)]"
                    />
                    데이터 없음
                </div>
            </div>
        </template>

        <!-- 미세먼지 레이어 -->
        <template v-else-if="activeLayer?.isPm10">
            <p class="text-xs text-meta mb-1.5 font-semibold tracking-[0.04em] uppercase">
                미세먼지
            </p>
            <div class="flex flex-col gap-1">
                <!-- 기준치 헤더 -->
                <div class="flex items-center gap-1 text-[10px] text-meta mb-0.5">
                    <span class="w-3 shrink-0" />
                    <span class="w-[52px] shrink-0" />
                    <span class="w-[38px] text-center">PM10</span>
                    <span class="w-[38px] text-center">PM2.5</span>
                </div>
                <div
                    v-for="item in dustItems"
                    :key="item.label"
                    class="flex items-center gap-1 text-xs text-text-muted"
                >
                    <span
                        class="w-3 h-3 rounded-lg border border-(--ui-border) shrink-0"
                        :style="{ background: item.color }"
                    />
                    <span class="w-[52px] shrink-0">{{ item.label }}</span>
                    <span class="w-[38px] text-center text-[10px] text-meta">{{ item.pm10 }}</span>
                    <span class="w-[38px] text-center text-[10px] text-meta">{{ item.pm25 }}</span>
                </div>
                <div class="flex items-center gap-1.5 text-xs text-text-muted">
                    <span
                        class="w-3 h-3 rounded-lg border border-dashed border-(--ui-border) shrink-0 bg-[rgba(80,80,80,0.3)]"
                    />
                    데이터 없음
                </div>
                <p class="text-[10px] text-meta mt-1 leading-tight">
                    둘 중 하나라도 상위 단계이면 해당 등급 적용
                </p>
            </div>
        </template>
    </div>
</template>
