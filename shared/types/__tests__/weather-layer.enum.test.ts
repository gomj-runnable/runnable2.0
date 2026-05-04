import { describe, it, expect } from 'vitest'
import { tempToColor, WeatherLayerEnum } from '#shared/types/weather-layer.enum'
import type { HourlyWeather } from '#shared/types/weather'

// ─── tempToColor() ────────────────────────────────────────────────────────

describe('tempToColor()', () => {
    it('-10°C 이하는 최저 파란색 경계값으로 클램프된다', () => {
        const at10 = tempToColor(-10)
        const below = tempToColor(-20)
        expect(below).toBe(at10)
    })

    it('40°C 이상은 최고 빨간색 경계값으로 클램프된다', () => {
        const at40 = tempToColor(40)
        const above = tempToColor(50)
        expect(above).toBe(at40)
    })

    it('-10°C는 파란색 계열 rgba를 반환한다', () => {
        const color = tempToColor(-10)
        // rgb(48, 118, 255)
        expect(color).toBe('rgba(48, 118, 255, 0.2)')
    })

    it('0°C는 하늘색 계열 rgba를 반환한다', () => {
        const color = tempToColor(0)
        // rgb(57, 196, 255)
        expect(color).toBe('rgba(57, 196, 255, 0.2)')
    })

    it('15°C는 초록색 계열 rgba를 반환한다', () => {
        const color = tempToColor(15)
        // rgb(122, 214, 102)
        expect(color).toBe('rgba(122, 214, 102, 0.2)')
    })

    it('25°C는 노란색 계열 rgba를 반환한다', () => {
        const color = tempToColor(25)
        // rgb(247, 203, 69)
        expect(color).toBe('rgba(247, 203, 69, 0.2)')
    })

    it('40°C는 빨간색 계열 rgba를 반환한다', () => {
        const color = tempToColor(40)
        // rgb(230, 90, 58)
        expect(color).toBe('rgba(230, 90, 58, 0.2)')
    })

    it('모든 반환값은 rgba( 형식으로 시작한다', () => {
        for (const temp of [-10, 0, 10, 20, 30, 40]) {
            expect(tempToColor(temp)).toMatch(/^rgba\(/)
        }
    })

    it('온도가 높아질수록 빨간색 채널이 증가하는 경향이 있다', () => {
        const parseR = (color: string) => parseInt(color.split('(')[1]?.split(',')[0] ?? '0')
        // 0°C(57) -> 40°C(230)
        expect(parseR(tempToColor(40))).toBeGreaterThan(parseR(tempToColor(0)))
    })
})

// ─── WeatherLayerEnum.resolveColor() ──────────────────────────────────────

const makeWeather = (overrides: Partial<HourlyWeather> = {}): HourlyWeather => ({
    date: '2026-04-29',
    time: '12:00',
    condition: 'clear',
    temperature: 20,
    pm10: 45,
    pm10Grade: 'moderate',
    source: 'forecast',
    ...overrides
})

describe('WeatherLayerEnum.resolveColor()', () => {
    describe('WEATHER 레이어', () => {
        it('condition="clear"이면 CLEAR의 color를 반환한다', () => {
            const weather = makeWeather({ condition: 'clear' })
            const color = WeatherLayerEnum.WEATHER.resolveColor(weather)
            expect(color).toMatch(/^rgba\(/)
            expect(color).toBe('rgba(255, 230, 50, 0.2)')
        })

        it('condition="rainy"이면 RAINY의 color를 반환한다', () => {
            const weather = makeWeather({ condition: 'rainy' })
            expect(WeatherLayerEnum.WEATHER.resolveColor(weather)).toBe('rgba(60, 150, 220, 0.2)')
        })

        it('condition="snowy"이면 SNOWY의 color를 반환한다', () => {
            const weather = makeWeather({ condition: 'snowy' })
            expect(WeatherLayerEnum.WEATHER.resolveColor(weather)).toBe('rgba(150, 210, 250, 0.2)')
        })

        it('condition="cloudy"이면 CLOUDY의 color를 반환한다', () => {
            const weather = makeWeather({ condition: 'cloudy' })
            expect(WeatherLayerEnum.WEATHER.resolveColor(weather)).toBe('rgba(120, 120, 160, 0.2)')
        })
    })

    describe('TEMPERATURE 레이어', () => {
        it('temperature=0이면 tempToColor(0) 결과를 반환한다', () => {
            const weather = makeWeather({ temperature: 0 })
            expect(WeatherLayerEnum.TEMPERATURE.resolveColor(weather)).toBe(tempToColor(0))
        })

        it('temperature=25이면 tempToColor(25) 결과를 반환한다', () => {
            const weather = makeWeather({ temperature: 25 })
            expect(WeatherLayerEnum.TEMPERATURE.resolveColor(weather)).toBe(tempToColor(25))
        })
    })

    describe('PM10 레이어', () => {
        it('pm10Grade="good"이면 GOOD의 color를 반환한다', () => {
            const weather = makeWeather({ pm10Grade: 'good' })
            expect(WeatherLayerEnum.PM10.resolveColor(weather)).toBe('rgba(100, 200, 100, 0.2)')
        })

        it('pm10Grade="very-bad"이면 VERY_BAD의 color를 반환한다', () => {
            const weather = makeWeather({ pm10Grade: 'very-bad' })
            expect(WeatherLayerEnum.PM10.resolveColor(weather)).toBe('rgba(220, 60, 60, 0.2)')
        })

        it('pm10Grade가 null이면 NO_DATA_COLOR를 반환한다', () => {
            const weather = makeWeather({ pm10Grade: null })
            expect(WeatherLayerEnum.PM10.resolveColor(weather)).toBe('rgba(80, 80, 80, 0.3)')
        })
    })
})

// ─── WeatherLayerEnum 인스턴스 속성 ───────────────────────────────────────

describe('WeatherLayerEnum 인스턴스 속성', () => {
    it('WEATHER.isWeather는 true다', () => {
        expect(WeatherLayerEnum.WEATHER.isWeather).toBe(true)
    })

    it('TEMPERATURE.isWeather는 false다', () => {
        expect(WeatherLayerEnum.TEMPERATURE.isWeather).toBe(false)
    })

    it('TEMPERATURE.isTemperature는 true다', () => {
        expect(WeatherLayerEnum.TEMPERATURE.isTemperature).toBe(true)
    })

    it('PM10.isPm10는 true다', () => {
        expect(WeatherLayerEnum.PM10.isPm10).toBe(true)
    })

    it('WEATHER.isPm10는 false다', () => {
        expect(WeatherLayerEnum.WEATHER.isPm10).toBe(false)
    })

    it('WEATHER.label이 "예보"다', () => {
        expect(WeatherLayerEnum.WEATHER.label).toBe('예보')
    })

    it('TEMPERATURE.label이 "온도"다', () => {
        expect(WeatherLayerEnum.TEMPERATURE.label).toBe('온도')
    })

    it('PM10.label이 "미세먼지"다', () => {
        expect(WeatherLayerEnum.PM10.label).toBe('미세먼지')
    })
})

// ─── WeatherLayerEnum.from() ──────────────────────────────────────────────

describe('WeatherLayerEnum.from()', () => {
    it('"weather"로 WEATHER 인스턴스를 찾는다', () => {
        expect(WeatherLayerEnum.from('weather')).toBe(WeatherLayerEnum.WEATHER)
    })

    it('"temperature"로 TEMPERATURE 인스턴스를 찾는다', () => {
        expect(WeatherLayerEnum.from('temperature')).toBe(WeatherLayerEnum.TEMPERATURE)
    })

    it('"pm10"으로 PM10 인스턴스를 찾는다', () => {
        expect(WeatherLayerEnum.from('pm10')).toBe(WeatherLayerEnum.PM10)
    })

    it('알 수 없는 key이면 undefined를 반환한다', () => {
        expect(WeatherLayerEnum.from('unknown')).toBeUndefined()
    })
})
