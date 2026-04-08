<script setup lang="ts">
import type { ShallowRef } from 'vue'
import type { CesiumViewer } from '~/composables/useWindow'
import type { SeoulMonthlyWeather, WeatherLayer } from '#shared/types/weather'
import WeatherLayerToggle from '~/components/map/molecules/weather/WeatherLayerToggle.vue'
import WeatherDatePicker from '~/components/map/molecules/weather/WeatherDatePicker.vue'
import WeatherLegend from '~/components/map/molecules/weather/WeatherLegend.vue'

const props = defineProps<{
    viewer: ShallowRef<CesiumViewer | null>
    selectedDate: string
    selectedMonth: string
    activeLayer: WeatherLayer
    monthlyData: SeoulMonthlyWeather | null
    isLoading: boolean
}>()

const emit = defineEmits<{
    'update:selectedDate': [date: string]
    'update:selectedMonth': [month: string]
    'update:activeLayer': [layer: WeatherLayer]
}>()

const isCalendarOpen = ref(false)

/** 선택 날짜에 데이터가 있는지 확인 */
const hasDataForSelectedDate = computed(() => {
    if (!props.monthlyData) return false
    return props.monthlyData.dongs.some(d =>
        d.monthly.some(w => w.date === props.selectedDate)
    )
})
</script>

<template>
    <div class="weather-overlay">
        <div class="weather-overlay__topbar">
            <div class="weather-overlay__controls">
                <WeatherLayerToggle
                    :model-value="activeLayer"
                    @update:model-value="emit('update:activeLayer', $event)"
                />
                <div class="weather-overlay__calendar-wrap">
                    <button
                        class="weather-overlay__calendar-toggle"
                        :class="{ 'is-no-data': !hasDataForSelectedDate && !isLoading }"
                        @click="isCalendarOpen = !isCalendarOpen"
                    >
                        <span class="i-lucide-calendar" />
                        <span>{{ selectedDate }}</span>
                        <span
                            v-if="!hasDataForSelectedDate && !isLoading"
                            class="weather-overlay__no-data-badge"
                        >데이터 없음</span>
                        <span v-if="isLoading" class="i-lucide-loader-2 weather-overlay__spinner" />
                    </button>
                    <Transition name="calendar-fade">
                        <WeatherDatePicker
                            v-if="isCalendarOpen"
                            :model-value="selectedDate"
                            :month="selectedMonth"
                            :monthly-data="monthlyData"
                            @update:model-value="emit('update:selectedDate', $event); isCalendarOpen = false"
                            @update:month="emit('update:selectedMonth', $event)"
                        />
                    </Transition>
                </div>
                <WeatherLegend :active-layer="activeLayer" />
            </div>
        </div>
    </div>
</template>

<style scoped src="~/assets/css/components/templates/WeatherOverlay.css"></style>

<style>
/* 캘린더는 토글 버튼 바로 아래에 띄운다 (non-scoped: 자식 컴포넌트 DOM 접근) */
.weather-overlay__calendar-wrap .weather-date-picker {
    position: absolute;
    top: calc(100% + var(--gap-2));
    left: 0;
    z-index: 1;
}
</style>
