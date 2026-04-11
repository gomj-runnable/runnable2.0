<script setup lang="ts">
import type { SeoulMonthlyWeather } from '#shared/types/weather'

const props = defineProps<{
    /** 현재 선택된 날짜 문자열 (형식: "YYYY-MM-DD") */
    modelValue: string // "2025-04-08"
    /** 달력에 표시할 연월 문자열 (형식: "YYYYMM") */
    month: string // "202504"
    /** 선택 가능한 날짜 범위를 포함한 월별 날씨 데이터 */
    monthlyData: SeoulMonthlyWeather | null
}>()

/** 날짜 선택 및 월 이동 이벤트 */
const emit = defineEmits<{
    /** 날짜 선택 시 "YYYY-MM-DD" 형식으로 발행 */
    'update:modelValue': [date: string]
    /** 월 이동 시 "YYYYMM" 형식으로 발행 */
    'update:month': [month: string]
}>()

const calendarYear = computed(() => parseInt(props.month.slice(0, 4)))
const calendarMonth = computed(() => parseInt(props.month.slice(4, 6)))
const activeMonthKey = computed(
    () => `${calendarYear.value}${String(calendarMonth.value).padStart(2, '0')}`
)

const monthLabel = computed(() => `${calendarYear.value}년 ${calendarMonth.value}월`)

// 해당 월의 날짜 데이터 집합 (데이터 있는 날짜)
const availableDates = computed(() => {
    if (!props.monthlyData) return new Set<string>()
    const dates = new Set<string>()
    for (const dong of props.monthlyData.dongs) {
        for (const d of dong.hourly) dates.add(d.date)
    }
    return dates
})

// 달력 첫날의 요일 (0=일요일)
const firstDayOfWeek = computed(() =>
    new Date(calendarYear.value, calendarMonth.value - 1, 1).getDay()
)

// 해당 월의 총 일수
const daysInMonth = computed(() => new Date(calendarYear.value, calendarMonth.value, 0).getDate())

const today = new Date().toISOString().slice(0, 10)

const minMonth = computed(() =>
    props.monthlyData?.rangeStart ? props.monthlyData.rangeStart.slice(0, 7).replace('-', '') : null
)
const maxMonth = computed(() =>
    props.monthlyData?.rangeEnd ? props.monthlyData.rangeEnd.slice(0, 7).replace('-', '') : null
)
const canMovePrev = computed(() => !minMonth.value || activeMonthKey.value > minMonth.value)
const nextMonthFromNow = computed(() => {
    const now = new Date()
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    return `${next.getFullYear()}${String(next.getMonth() + 1).padStart(2, '0')}`
})
const canMoveNext = computed(() => {
    const upperBound = maxMonth.value
        ? maxMonth.value > nextMonthFromNow.value ? maxMonth.value : nextMonthFromNow.value
        : nextMonthFromNow.value
    return activeMonthKey.value < upperBound
})

// 날짜 문자열 생성 (YYYY-MM-DD)
const toDateStr = (day: number) => {
    const y = calendarYear.value
    const m = String(calendarMonth.value).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${y}-${m}-${d}`
}

/** 이전 달로 이동하고 month 변경 이벤트를 발행한다 */
const prevMonth = () => {
    if (!canMovePrev.value) return
    const d = new Date(calendarYear.value, calendarMonth.value - 2, 1)
    emit('update:month', `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`)
}

/** 다음 달로 이동하고 month 변경 이벤트를 발행한다 */
const nextMonth = () => {
    if (!canMoveNext.value) return
    const d = new Date(calendarYear.value, calendarMonth.value, 1)
    emit('update:month', `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`)
}

/** 날짜를 선택하고 modelValue 변경 이벤트를 발행한다 */
const selectDay = (day: number) => {
    emit('update:modelValue', toDateStr(day))
}
</script>

<template>
    <div class="weather-date-picker">
        <div class="weather-date-picker__header">
            <button
                class="weather-date-picker__nav-btn"
                :disabled="!canMovePrev"
                @click="prevMonth"
            >
                <span class="i-lucide-chevron-left" />
            </button>
            <span class="weather-date-picker__month-label">{{ monthLabel }}</span>
            <button
                class="weather-date-picker__nav-btn"
                :disabled="!canMoveNext"
                @click="nextMonth"
            >
                <span class="i-lucide-chevron-right" />
            </button>
        </div>

        <div class="weather-date-picker__weekdays">
            <span
                v-for="day in ['일', '월', '화', '수', '목', '금', '토']"
                :key="day"
                class="weather-date-picker__weekday"
                >{{ day }}</span
            >
        </div>

        <div class="weather-date-picker__grid">
            <!-- 빈 셀 (첫 주 여백) -->
            <span
                v-for="i in firstDayOfWeek"
                :key="`empty-${i}`"
                class="weather-date-picker__day weather-date-picker__day--empty"
            />

            <!-- 날짜 버튼 -->
            <button
                v-for="day in daysInMonth"
                :key="day"
                class="weather-date-picker__day"
                :class="{
                    'is-selected': modelValue === toDateStr(day),
                    'is-today': today === toDateStr(day),
                    'is-no-data': !availableDates.has(toDateStr(day))
                }"
                @click="selectDay(day)"
            >
                {{ day }}
            </button>
        </div>
    </div>
</template>

<style scoped src="~/assets/css/components/molecules/WeatherDatePicker.css"></style>
