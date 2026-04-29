<script setup lang="ts">
import type { WeatherLayerEnum } from '#shared/types/weather-layer.enum'
import { CalendarDate, Time } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'
import WeatherLayerToggle from '~/entities/weather/ui/WeatherLayerToggle.vue'
import WeatherLegend from '~/entities/weather/ui/WeatherLegend.vue'
import ElevationLegend from '~/entities/weather/ui/ElevationLegend.vue'
const props = defineProps<{
    /** 현재 선택된 날짜 (YYYY-MM-DD) */
    selectedDate: string
    /** 현재 선택된 시간 (HH:mm) */
    selectedHour: string
    /** 현재 선택된 월 (YYYY-MM) */
    selectedMonth: string
    /** 현재 활성화된 날씨 레이어 타입 */
    activeLayer: WeatherLayerEnum | null
    /** 날씨 데이터 로딩 중 여부 */
    isLoading: boolean
    /** 고도 레이어 활성화 여부 */
    isElevationActive: boolean
    /** 활성 소스 기반 가용 날짜 목록 */
    availableDates: Set<string>
}>()

const emit = defineEmits<{
    /** 날짜 선택 변경 시 새 날짜를 전달 */
    'update:selectedDate': [date: string]
    /** 시간 선택 변경 시 새 시간을 전달 */
    'update:selectedHour': [hour: string]
    /** 월 선택 변경 시 새 월을 전달 */
    'update:selectedMonth': [month: string]
    /** 날씨 레이어 전환 시 새 레이어 타입을 전달 */
    'update:activeLayer': [layer: WeatherLayerEnum | null]
    /** 고도 레이어 활성화 상태 변경 시 전달 */
    'update:elevationActive': [active: boolean]
}>()

const inputDate = useTemplateRef('inputDate')

/** 날씨 레이어 변경: 레이어 선택 시 고도 레이어를 끈다 */
const handleLayerChange = (layer: WeatherLayerEnum | null) => {
    emit('update:activeLayer', layer)
    if (layer !== null && props.isElevationActive) {
        emit('update:elevationActive', false)
    }
}

/** props.selectedDate("YYYY-MM-DD") → CalendarDate 변환 */
const dateValue = computed(() => {
    const parts = props.selectedDate.split('-')
    if (parts.length !== 3) return undefined
    return new CalendarDate(parseInt(parts[0]!), parseInt(parts[1]!), parseInt(parts[2]!))
})

/** props.selectedMonth("YYYYMM") → CalendarDate placeholder 변환 */
const calendarPlaceholder = computed(() => {
    const y = parseInt(props.selectedMonth.slice(0, 4))
    const m = parseInt(props.selectedMonth.slice(4, 6))
    return new CalendarDate(y, m, 1)
})

/** props.selectedHour("HH:mm") → Time 변환 */
const timeValue = computed(() => {
    const parts = props.selectedHour.split(':')
    if (parts.length !== 2) return undefined
    return new Time(parseInt(parts[0]!), parseInt(parts[1]!))
})

/** availableDates 기반 날짜 비활성 판정 */
const isDateUnavailable = (date: DateValue) => {
    const dateStr = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
    return props.availableDates.size > 0 && !props.availableDates.has(dateStr)
}

/** CalendarDate 선택 → 문자열로 변환하여 부모에 전달 */
const handleDateChange = (value: any) => {
    if (!value || typeof value !== 'object' || !('year' in value)) return
    const dateStr = `${value.year}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`
    emit('update:selectedDate', dateStr)
}

/** 캘린더 월 이동 → selectedMonth 갱신 */
const handlePlaceholderChange = (date: DateValue) => {
    const monthStr = `${date.year}${String(date.month).padStart(2, '0')}`
    emit('update:selectedMonth', monthStr)
}

/** Time 변경 → 문자열로 변환하여 부모에 전달 */
const handleTimeChange = (value: any) => {
    if (!value || typeof value !== 'object' || !('hour' in value)) return
    const hourStr = `${String(value.hour).padStart(2, '0')}:${String(value.minute).padStart(2, '0')}`
    emit('update:selectedHour', hourStr)
}
</script>

<template>
    <div class="weather-overlay">
        <div class="weather-overlay__topbar">
            <div class="weather-overlay__controls">
                <WeatherLayerToggle
                    :model-value="activeLayer"
                    @update:model-value="handleLayerChange"
                />
                <div class="weather-overlay__datetime-row">
                    <UInputDate
                        ref="inputDate"
                        :model-value="dateValue"
                        size="sm"
                        :is-date-unavailable="isDateUnavailable"
                        @update:model-value="handleDateChange"
                    >
                        <template #trailing>
                            <UPopover>
                                <UButton
                                    color="neutral"
                                    variant="subtle"
                                    size="sm"
                                    icon="i-lucide-calendar"
                                    aria-label="날짜 선택"
                                />
                                <template #content>
                                    <UCalendar
                                        :model-value="dateValue"
                                        :placeholder="calendarPlaceholder"
                                        :is-date-unavailable="isDateUnavailable"
                                        class="p-2"
                                        @update:model-value="handleDateChange"
                                        @update:placeholder="handlePlaceholderChange"
                                    />
                                </template>
                            </UPopover>
                        </template>
                    </UInputDate>
                    <UInputTime
                        :model-value="timeValue"
                        icon="i-lucide-clock"
                        size="sm"
                        granularity="hour"
                        @update:model-value="handleTimeChange"
                    />
                    <span v-if="isLoading" class="i-lucide-loader-2 weather-overlay__spinner" />
                </div>
            </div>
        </div>
        <div v-if="activeLayer" class="weather-overlay__bottombar">
            <WeatherLegend :active-layer="activeLayer" />
        </div>
        <div v-else-if="isElevationActive" class="weather-overlay__bottombar">
            <ElevationLegend />
        </div>
    </div>
</template>

<style scoped src="./WeatherOverlay.css"></style>
