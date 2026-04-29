import { describe, it, expect } from 'vitest'
import {
    toWeatherCondition,
    toPm10Grade,
    conditionToColor,
    pm10GradeToColor,
    toOpaqueColor,
    conditionToIcon,
    conditionLabel
} from '~/entities/weather/lib/useWeatherDataTransform'

// ─── toWeatherCondition ───────────────────────────────────────────────────
describe('toWeatherCondition', () => {
    it('PTY=0, SKY=1이면 "clear"를 반환한다', () => {
        expect(toWeatherCondition(0, 1)).toBe('clear')
    })

    it('PTY=0, SKY=3이면 "partly-cloudy"를 반환한다', () => {
        expect(toWeatherCondition(0, 3)).toBe('partly-cloudy')
    })

    it('PTY=0, SKY=4이면 "cloudy"를 반환한다', () => {
        expect(toWeatherCondition(0, 4)).toBe('cloudy')
    })

    it('PTY=1이면 "rainy"를 반환한다', () => {
        expect(toWeatherCondition(1, 1)).toBe('rainy')
    })

    it('PTY=4이면 "rainy"를 반환한다', () => {
        expect(toWeatherCondition(4, 1)).toBe('rainy')
    })

    it('PTY=3이면 "snowy"를 반환한다 (온도 미제공 시)', () => {
        expect(toWeatherCondition(3, 1)).toBe('snowy')
    })

    it('PTY=2이면 "snowy"를 반환한다 (온도 미제공 시)', () => {
        expect(toWeatherCondition(2, 1)).toBe('snowy')
    })
})

// ─── toPm10Grade ──────────────────────────────────────────────────────────
describe('toPm10Grade', () => {
    it('PM10 ≤ 30이면 "good"을 반환한다', () => {
        expect(toPm10Grade(0)).toBe('good')
        expect(toPm10Grade(30)).toBe('good')
    })

    it('PM10 31~80이면 "moderate"를 반환한다', () => {
        expect(toPm10Grade(31)).toBe('moderate')
        expect(toPm10Grade(80)).toBe('moderate')
    })

    it('PM10 81~150이면 "bad"를 반환한다', () => {
        expect(toPm10Grade(81)).toBe('bad')
        expect(toPm10Grade(150)).toBe('bad')
    })

    it('PM10 > 150이면 "very-bad"를 반환한다', () => {
        expect(toPm10Grade(151)).toBe('very-bad')
        expect(toPm10Grade(999)).toBe('very-bad')
    })
})

// ─── conditionToColor ─────────────────────────────────────────────────────
describe('conditionToColor', () => {
    it('"clear" 상태의 색상은 rgba 문자열이다', () => {
        const color = conditionToColor('clear')
        expect(color).toMatch(/^rgba\(/)
    })

    it('"rainy" 상태의 색상과 "clear" 상태의 색상은 서로 다르다', () => {
        expect(conditionToColor('rainy')).not.toBe(conditionToColor('clear'))
    })

    it('각 날씨 상태마다 고유한 색상을 반환한다', () => {
        const conditions = ['clear', 'partly-cloudy', 'cloudy', 'rainy', 'snowy'] as const
        const colors = conditions.map(conditionToColor)
        const unique = new Set(colors)
        expect(unique.size).toBe(colors.length)
    })
})

// ─── pm10GradeToColor ─────────────────────────────────────────────────────
describe('pm10GradeToColor', () => {
    it('"good" 등급의 색상은 rgba 문자열이다', () => {
        expect(pm10GradeToColor('good')).toMatch(/^rgba\(/)
    })

    it('각 등급마다 고유한 색상을 반환한다', () => {
        const grades = ['good', 'moderate', 'bad', 'very-bad'] as const
        const colors = grades.map(pm10GradeToColor)
        const unique = new Set(colors)
        expect(unique.size).toBe(colors.length)
    })
})

// ─── toOpaqueColor ────────────────────────────────────────────────────────
describe('toOpaqueColor', () => {
    it('rgba 색상의 알파값을 1로 변경한다', () => {
        expect(toOpaqueColor('rgba(255, 230, 50, 0.2)')).toBe('rgba(255, 230, 50, 1)')
    })

    it('이미 알파가 1인 색상은 그대로 반환한다', () => {
        expect(toOpaqueColor('rgba(100, 200, 100, 1)')).toBe('rgba(100, 200, 100, 1)')
    })

    it('알파가 0인 색상을 불투명하게 변경한다', () => {
        expect(toOpaqueColor('rgba(0, 0, 0, 0)')).toBe('rgba(0, 0, 0, 1)')
    })

    it('rgba가 아닌 색상 문자열은 그대로 반환한다', () => {
        expect(toOpaqueColor('#FF0000')).toBe('#FF0000')
    })

    it('소수점 알파값도 올바르게 처리한다', () => {
        expect(toOpaqueColor('rgba(120, 120, 160, 0.35)')).toBe('rgba(120, 120, 160, 1)')
    })
})

// ─── conditionToIcon ──────────────────────────────────────────────────────
describe('conditionToIcon', () => {
    it('"clear" 상태의 아이콘은 문자열이다', () => {
        expect(typeof conditionToIcon('clear')).toBe('string')
    })

    it('각 날씨 상태마다 고유한 아이콘을 반환한다', () => {
        const conditions = ['clear', 'partly-cloudy', 'cloudy', 'rainy', 'snowy'] as const
        const icons = conditions.map(conditionToIcon)
        const unique = new Set(icons)
        expect(unique.size).toBe(icons.length)
    })
})

// ─── conditionLabel ───────────────────────────────────────────────────────
describe('conditionLabel', () => {
    it('"clear" 상태의 레이블은 "맑음"이다', () => {
        expect(conditionLabel('clear')).toBe('맑음')
    })

    it('"rainy" 상태의 레이블은 "비"이다', () => {
        expect(conditionLabel('rainy')).toBe('비')
    })

    it('"snowy" 상태의 레이블은 "눈"이다', () => {
        expect(conditionLabel('snowy')).toBe('눈')
    })

    it('"cloudy" 상태의 레이블은 "흐림"이다', () => {
        expect(conditionLabel('cloudy')).toBe('흐림')
    })

    it('"partly-cloudy" 상태의 레이블은 "구름많음"이다', () => {
        expect(conditionLabel('partly-cloudy')).toBe('구름많음')
    })
})
