<script setup lang="ts">
import type { SeoulMonthlyWeather } from '#shared/types/weather'
import type { WeatherLayerEnum } from '#shared/types/weather-layer.enum'
import WeatherLayerToggle from '~/entities/weather/ui/WeatherLayerToggle.vue'
import WeatherDatePicker from '~/entities/weather/ui/WeatherDatePicker.vue'
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
    /** 서울 월별 날씨 데이터 (없으면 null) */
    monthlyData: SeoulMonthlyWeather | null
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

const isCalendarOpen = ref(false)

/** 고도 레이어 토글: 활성화 시 날씨 레이어를 끈다 */
const handleElevationToggle = () => {
    const next = !props.isElevationActive
    emit('update:elevationActive', next)
    if (next) {
        emit('update:activeLayer', null)
    }
}

/** 날씨 레이어 변경: 레이어 선택 시 고도 레이어를 끈다 */
const handleLayerChange = (layer: WeatherLayerEnum | null) => {
    emit('update:activeLayer', layer)
    if (layer !== null && props.isElevationActive) {
        emit('update:elevationActive', false)
    }
}

/** 날짜를 선택하고 캘린더 팝업을 닫는다 */
const handleDateSelect = (date: string) => {
    // 선택한 날짜를 부모에 전달
    emit('update:selectedDate', date)
    // 캘린더 팝업 닫기
    isCalendarOpen.value = false
}

/** 선택 날짜에 데이터가 있는지 확인 */
const hasDataForSelectedDate = computed(() => {
    return props.availableDates.size > 0 && props.availableDates.has(props.selectedDate)
})

/** 날짜 표시 (MM.DD) */
const dateLabel = computed(() => {
    const parts = props.selectedDate.split('-')
    return parts.length === 3 ? `${parts[1]}.${parts[2]}` : props.selectedDate
})

/** 선택된 날짜에 해당하는 시간 옵션 목록을 반환한다 (데이터가 없으면 현재 시각 기본값) */
const hourOptions = computed(() => {
    const source = new Set<string>()

    // 월별 데이터에서 선택 날짜에 해당하는 시간 슬롯 수집
    if (props.monthlyData) {
        for (const dong of props.monthlyData.dongs) {
            for (const slot of dong.hourly) {
                if (slot.date === props.selectedDate) {
                    source.add(slot.time)
                }
            }
        }
    }

    // 오름차순 정렬 후 반환
    const sorted = Array.from(source).sort((a, b) => a.localeCompare(b))
    if (sorted.length > 0) {
        return sorted
    }

    // 데이터가 없으면 현재 시각을 기본값으로 제공
    return [`${new Date().getHours().toString().padStart(2, '0')}:00`]
})

/** 시간 드롭다운 메뉴 아이템 목록 */
const hourMenuItems = computed(() => [
    hourOptions.value.map(hour => ({
        label: hour,
        active: props.selectedHour === hour,
        onSelect: () => emit('update:selectedHour', hour)
    }))
])

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
                    @update:model-value="handleLayerChange"
                />
                <div class="weather-overlay__datetime-row">
                    <UPopover v-model:open="isCalendarOpen" :overlay="false">
                        <UButton
                            id="popup-weather-calendar-trigger"
                            :label="dateLabel"
                            icon="i-lucide-calendar"
                            size="sm"
                            :variant="isCalendarOpen ? 'solid' : 'outline'"
                            :color="isCalendarOpen ? 'primary' : 'neutral'"
                            :class="{ 'is-no-data': !hasDataForSelectedDate && !isLoading }"
                        />
                        <template #content>
                            <section class="weather-overlay__calendar-popover">
                                <header class="weather-overlay__calendar-popover-header">
                                    <h2 class="weather-overlay__calendar-popover-title">
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
                                    :available-dates="availableDates"
                                    @update:model-value="handleDateSelect"
                                    @update:month="emit('update:selectedMonth', $event)"
                                />
                            </section>
                        </template>
                    </UPopover>
                    <UDropdownMenu :items="hourMenuItems">
                        <UButton
                            :label="hourLabel"
                            icon="i-lucide-clock-3"
                            size="sm"
                            variant="outline"
                            color="neutral"
                        />
                    </UDropdownMenu>
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
