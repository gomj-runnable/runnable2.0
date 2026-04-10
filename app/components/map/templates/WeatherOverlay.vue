<script setup lang="ts">
import type { SeoulMonthlyWeather, WeatherLayer } from '#shared/types/weather'
import ChipButton from '~/components/map/molecules/buttons/ChipButton.vue'
import WeatherLayerToggle from '~/components/map/molecules/weather/WeatherLayerToggle.vue'
import WeatherDatePicker from '~/components/map/molecules/weather/WeatherDatePicker.vue'
import WeatherLegend from '~/components/map/molecules/weather/WeatherLegend.vue'
import PopupModal from '~/components/map/templates/PopupModal.vue'

const props = defineProps<{
    selectedDate: string
    selectedHour: string
    selectedMonth: string
    activeLayer: WeatherLayer
    monthlyData: SeoulMonthlyWeather | null
    isLoading: boolean
}>()

const emit = defineEmits<{
    'update:selectedDate': [date: string]
    'update:selectedHour': [hour: string]
    'update:selectedMonth': [month: string]
    'update:activeLayer': [layer: WeatherLayer]
}>()

const isCalendarOpen = ref(false)

const handleDateSelect = (date: string) => {
    emit('update:selectedDate', date)
    isCalendarOpen.value = false
}

/** 선택 날짜에 데이터가 있는지 확인 */
const hasDataForSelectedDate = computed(() => {
    if (!props.monthlyData) return false
    return props.monthlyData.dongs.some((d) => d.hourly.some((w) => w.date === props.selectedDate))
})

/** 날짜 표시 (MM.DD) */
const dateLabel = computed(() => {
    const parts = props.selectedDate.split('-')
    return parts.length === 3 ? `${parts[1]}.${parts[2]}` : props.selectedDate
})

const hourOptions = computed(() => {
    const source = new Set<string>()

    if (props.monthlyData) {
        for (const dong of props.monthlyData.dongs) {
            for (const slot of dong.hourly) {
                if (slot.date === props.selectedDate) {
                    source.add(slot.time)
                }
            }
        }
    }

    const sorted = Array.from(source).sort((a, b) => a.localeCompare(b))
    if (sorted.length > 0) {
        return sorted
    }

    return [`${new Date().getHours().toString().padStart(2, '0')}:00`]
})

const isHourOpen = ref(false)

const selectHour = (hour: string) => {
    emit('update:selectedHour', hour)
    isHourOpen.value = false
}

/** 시간 표시 (HH시) */
const hourLabel = computed(() => {
    const h = props.selectedHour.split(':')[0]
    return `${h}시`
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
                <div class="weather-overlay__datetime-row">
                    <div class="weather-overlay__calendar-wrap">
                        <ChipButton
                            id="popup-weather-calendar-trigger"
                            :label="dateLabel"
                            icon="i-lucide-calendar"
                            size="sm"
                            appearance="elevated"
                            :active="isCalendarOpen"
                            :class="{ 'is-no-data': !hasDataForSelectedDate && !isLoading }"
                            @click="isCalendarOpen = !isCalendarOpen"
                        />
                        <PopupModal
                            :open="isCalendarOpen"
                            popup-id="popup-weather-calendar"
                            aria-labelledby="popup-weather-calendar-title"
                            panel-class="weather-overlay__calendar-modal-panel"
                            @update:open="isCalendarOpen = $event"
                        >
                            <section class="weather-overlay__calendar-modal">
                                <header class="weather-overlay__calendar-modal-header">
                                    <h2
                                        id="popup-weather-calendar-title"
                                        class="weather-overlay__calendar-modal-title"
                                    >
                                        날짜 선택
                                    </h2>
                                    <button
                                        type="button"
                                        class="weather-overlay__calendar-close"
                                        aria-label="날짜 선택 닫기"
                                        @click="isCalendarOpen = false"
                                    >
                                        <span class="i-lucide-x" />
                                    </button>
                                </header>
                                <WeatherDatePicker
                                    :model-value="selectedDate"
                                    :month="selectedMonth"
                                    :monthly-data="monthlyData"
                                    @update:model-value="handleDateSelect"
                                    @update:month="emit('update:selectedMonth', $event)"
                                />
                            </section>
                        </PopupModal>
                    </div>
                    <div class="weather-overlay__hour-wrap">
                        <ChipButton
                            :label="hourLabel"
                            icon="i-lucide-clock-3"
                            size="sm"
                            appearance="elevated"
                            :active="isHourOpen"
                            @click="isHourOpen = !isHourOpen"
                        />
                        <div v-if="isHourOpen" class="weather-overlay__hour-dropdown">
                            <button
                                v-for="hour in hourOptions"
                                :key="hour"
                                class="weather-overlay__hour-option"
                                :class="{ 'is-active': selectedHour === hour }"
                                @click="selectHour(hour)"
                            >
                                {{ hour }}
                            </button>
                        </div>
                    </div>
                    <span v-if="isLoading" class="i-lucide-loader-2 weather-overlay__spinner" />
                </div>
            </div>
        </div>
        <div class="weather-overlay__bottombar">
            <WeatherLegend :active-layer="activeLayer" />
        </div>
    </div>
</template>

<style scoped src="~/assets/css/components/templates/WeatherOverlay.css"></style>
