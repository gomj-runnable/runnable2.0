<script setup lang="ts">
import type { SeoulMonthlyWeather } from '#shared/types/weather'

const props = defineProps<{
    modelValue: string          // "2025-04-08"
    month: string               // "202504"
    monthlyData: SeoulMonthlyWeather | null
}>()

const emit = defineEmits<{
    'update:modelValue': [date: string]
    'update:month': [month: string]
}>()

const calendarYear = computed(() => parseInt(props.month.slice(0, 4)))
const calendarMonth = computed(() => parseInt(props.month.slice(4, 6)))

const monthLabel = computed(() =>
    `${calendarYear.value}년 ${calendarMonth.value}월`
)

// 해당 월의 날짜 데이터 집합 (데이터 있는 날짜)
const availableDates = computed(() => {
    if (!props.monthlyData) return new Set<string>()
    const dates = new Set<string>()
    for (const dong of props.monthlyData.dongs) {
        for (const d of dong.monthly) dates.add(d.date)
    }
    return dates
})

// 달력 첫날의 요일 (0=일요일)
const firstDayOfWeek = computed(() =>
    new Date(calendarYear.value, calendarMonth.value - 1, 1).getDay()
)

// 해당 월의 총 일수
const daysInMonth = computed(() =>
    new Date(calendarYear.value, calendarMonth.value, 0).getDate()
)

const today = new Date().toISOString().slice(0, 10)

// 날짜 문자열 생성 (YYYY-MM-DD)
const toDateStr = (day: number) => {
    const y = calendarYear.value
    const m = String(calendarMonth.value).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${y}-${m}-${d}`
}

const prevMonth = () => {
    const d = new Date(calendarYear.value, calendarMonth.value - 2, 1)
    emit('update:month', `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`)
}

const nextMonth = () => {
    const d = new Date(calendarYear.value, calendarMonth.value, 1)
    emit('update:month', `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`)
}

const selectDay = (day: number) => {
    emit('update:modelValue', toDateStr(day))
}
</script>

<template>
    <div class="weather-date-picker">
        <div class="weather-date-picker__header">
            <button class="weather-date-picker__nav-btn" @click="prevMonth">
                <span class="i-lucide-chevron-left" />
            </button>
            <span class="weather-date-picker__month-label">{{ monthLabel }}</span>
            <button class="weather-date-picker__nav-btn" @click="nextMonth">
                <span class="i-lucide-chevron-right" />
            </button>
        </div>

        <div class="weather-date-picker__weekdays">
            <span
                v-for="day in ['일', '월', '화', '수', '목', '금', '토']"
                :key="day"
                class="weather-date-picker__weekday"
            >{{ day }}</span>
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
                    'is-no-data': !availableDates.has(toDateStr(day)),
                }"
                @click="selectDay(day)"
            >
                {{ day }}
            </button>
        </div>
    </div>
</template>

<style scoped src="~/assets/css/components/molecules/WeatherDatePicker.css"></style>
