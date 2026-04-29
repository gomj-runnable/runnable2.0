import { describe, it, expect } from 'vitest'
import { WeatherConditionEnum } from '#shared/types/weather-condition.enum'

// ─── fromKmaCode() ────────────────────────────────────────────────────────

describe('WeatherConditionEnum.fromKmaCode()', () => {
    it('PTY=1(비)이면 RAINY를 반환한다', () => {
        expect(WeatherConditionEnum.fromKmaCode(1, 1)).toBe(WeatherConditionEnum.RAINY)
    })

    it('PTY=4(소나기)이면 RAINY를 반환한다', () => {
        expect(WeatherConditionEnum.fromKmaCode(4, 1)).toBe(WeatherConditionEnum.RAINY)
    })

    it('PTY=2이고 기온이 0°C 초과이면 RAINY를 반환한다', () => {
        expect(WeatherConditionEnum.fromKmaCode(2, 1, 5)).toBe(WeatherConditionEnum.RAINY)
    })

    it('PTY=2이고 기온이 0°C 이하이면 SNOWY를 반환한다', () => {
        expect(WeatherConditionEnum.fromKmaCode(2, 1, 0)).toBe(WeatherConditionEnum.SNOWY)
    })

    it('PTY=2이고 기온이 음수이면 SNOWY를 반환한다', () => {
        expect(WeatherConditionEnum.fromKmaCode(2, 1, -3)).toBe(WeatherConditionEnum.SNOWY)
    })

    it('PTY=3이고 기온 정보가 없으면 SNOWY를 반환한다', () => {
        expect(WeatherConditionEnum.fromKmaCode(3, 1)).toBe(WeatherConditionEnum.SNOWY)
    })

    it('PTY=3이고 기온이 양수이면 RAINY를 반환한다', () => {
        expect(WeatherConditionEnum.fromKmaCode(3, 1, 10)).toBe(WeatherConditionEnum.RAINY)
    })

    it('PTY=0, SKY=1(맑음)이면 CLEAR를 반환한다', () => {
        expect(WeatherConditionEnum.fromKmaCode(0, 1)).toBe(WeatherConditionEnum.CLEAR)
    })

    it('PTY=0, SKY=3(구름많음)이면 PARTLY_CLOUDY를 반환한다', () => {
        expect(WeatherConditionEnum.fromKmaCode(0, 3)).toBe(WeatherConditionEnum.PARTLY_CLOUDY)
    })

    it('PTY=0, SKY=4(흐림)이면 CLOUDY를 반환한다', () => {
        expect(WeatherConditionEnum.fromKmaCode(0, 4)).toBe(WeatherConditionEnum.CLOUDY)
    })

    it('PTY=0, SKY가 알 수 없는 값이면 CLOUDY를 반환한다', () => {
        expect(WeatherConditionEnum.fromKmaCode(0, 99)).toBe(WeatherConditionEnum.CLOUDY)
    })
})

// ─── from() ───────────────────────────────────────────────────────────────

describe('WeatherConditionEnum.from()', () => {
    it('"clear"로 CLEAR 인스턴스를 찾는다', () => {
        expect(WeatherConditionEnum.from('clear')).toBe(WeatherConditionEnum.CLEAR)
    })

    it('"partly-cloudy"로 PARTLY_CLOUDY 인스턴스를 찾는다', () => {
        expect(WeatherConditionEnum.from('partly-cloudy')).toBe(WeatherConditionEnum.PARTLY_CLOUDY)
    })

    it('"cloudy"로 CLOUDY 인스턴스를 찾는다', () => {
        expect(WeatherConditionEnum.from('cloudy')).toBe(WeatherConditionEnum.CLOUDY)
    })

    it('"rainy"로 RAINY 인스턴스를 찾는다', () => {
        expect(WeatherConditionEnum.from('rainy')).toBe(WeatherConditionEnum.RAINY)
    })

    it('"snowy"로 SNOWY 인스턴스를 찾는다', () => {
        expect(WeatherConditionEnum.from('snowy')).toBe(WeatherConditionEnum.SNOWY)
    })

    it('알 수 없는 key이면 CLOUDY를 기본값으로 반환한다', () => {
        expect(WeatherConditionEnum.from('unknown')).toBe(WeatherConditionEnum.CLOUDY)
    })
})

// ─── 인스턴스 속성 ─────────────────────────────────────────────────────────

describe('WeatherConditionEnum 인스턴스 속성', () => {
    it('CLEAR의 icon이 i-lucide-sun이다', () => {
        expect(WeatherConditionEnum.CLEAR.icon).toBe('i-lucide-sun')
    })

    it('PARTLY_CLOUDY의 icon이 i-lucide-cloud-sun이다', () => {
        expect(WeatherConditionEnum.PARTLY_CLOUDY.icon).toBe('i-lucide-cloud-sun')
    })

    it('CLOUDY의 icon이 i-lucide-cloud이다', () => {
        expect(WeatherConditionEnum.CLOUDY.icon).toBe('i-lucide-cloud')
    })

    it('RAINY의 icon이 i-lucide-cloud-rain이다', () => {
        expect(WeatherConditionEnum.RAINY.icon).toBe('i-lucide-cloud-rain')
    })

    it('SNOWY의 icon이 i-lucide-snowflake이다', () => {
        expect(WeatherConditionEnum.SNOWY.icon).toBe('i-lucide-snowflake')
    })

    it('CLEAR의 label이 "맑음"이다', () => {
        expect(WeatherConditionEnum.CLEAR.label).toBe('맑음')
    })

    it('RAINY의 color에 rgba가 포함된다', () => {
        expect(WeatherConditionEnum.RAINY.color).toMatch(/^rgba\(/)
    })

    it('SNOWY의 color에 rgba가 포함된다', () => {
        expect(WeatherConditionEnum.SNOWY.color).toMatch(/^rgba\(/)
    })
})
