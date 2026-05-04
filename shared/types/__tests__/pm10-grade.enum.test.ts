import { describe, it, expect } from 'vitest'
import { Pm10GradeEnum } from '#shared/types/pm10-grade.enum'

// ─── fromValue() ──────────────────────────────────────────────────────────

describe('Pm10GradeEnum.fromValue()', () => {
    it('0µg/m³ → GOOD', () => {
        expect(Pm10GradeEnum.fromValue(0)).toBe(Pm10GradeEnum.GOOD)
    })

    it('30µg/m³(경계값) → GOOD', () => {
        expect(Pm10GradeEnum.fromValue(30)).toBe(Pm10GradeEnum.GOOD)
    })

    it('31µg/m³(경계값+1) → MODERATE', () => {
        expect(Pm10GradeEnum.fromValue(31)).toBe(Pm10GradeEnum.MODERATE)
    })

    it('80µg/m³(경계값) → MODERATE', () => {
        expect(Pm10GradeEnum.fromValue(80)).toBe(Pm10GradeEnum.MODERATE)
    })

    it('81µg/m³(경계값+1) → BAD', () => {
        expect(Pm10GradeEnum.fromValue(81)).toBe(Pm10GradeEnum.BAD)
    })

    it('150µg/m³(경계값) → BAD', () => {
        expect(Pm10GradeEnum.fromValue(150)).toBe(Pm10GradeEnum.BAD)
    })

    it('151µg/m³(경계값+1) → VERY_BAD', () => {
        expect(Pm10GradeEnum.fromValue(151)).toBe(Pm10GradeEnum.VERY_BAD)
    })

    it('999µg/m³(매우 높음) → VERY_BAD', () => {
        expect(Pm10GradeEnum.fromValue(999)).toBe(Pm10GradeEnum.VERY_BAD)
    })

    it('중간값 50µg/m³ → MODERATE', () => {
        expect(Pm10GradeEnum.fromValue(50)).toBe(Pm10GradeEnum.MODERATE)
    })

    it('중간값 120µg/m³ → BAD', () => {
        expect(Pm10GradeEnum.fromValue(120)).toBe(Pm10GradeEnum.BAD)
    })
})

// ─── from() ───────────────────────────────────────────────────────────────

describe('Pm10GradeEnum.from()', () => {
    it('"good"으로 GOOD 인스턴스를 찾는다', () => {
        expect(Pm10GradeEnum.from('good')).toBe(Pm10GradeEnum.GOOD)
    })

    it('"moderate"으로 MODERATE 인스턴스를 찾는다', () => {
        expect(Pm10GradeEnum.from('moderate')).toBe(Pm10GradeEnum.MODERATE)
    })

    it('"bad"으로 BAD 인스턴스를 찾는다', () => {
        expect(Pm10GradeEnum.from('bad')).toBe(Pm10GradeEnum.BAD)
    })

    it('"very-bad"으로 VERY_BAD 인스턴스를 찾는다', () => {
        expect(Pm10GradeEnum.from('very-bad')).toBe(Pm10GradeEnum.VERY_BAD)
    })

    it('알 수 없는 key이면 GOOD을 기본값으로 반환한다', () => {
        expect(Pm10GradeEnum.from('unknown')).toBe(Pm10GradeEnum.GOOD)
    })
})

// ─── 인스턴스 속성 ─────────────────────────────────────────────────────────

describe('Pm10GradeEnum 인스턴스 속성', () => {
    it('GOOD의 label이 "좋음"이다', () => {
        expect(Pm10GradeEnum.GOOD.label).toBe('좋음')
    })

    it('MODERATE의 label이 "보통"이다', () => {
        expect(Pm10GradeEnum.MODERATE.label).toBe('보통')
    })

    it('BAD의 label이 "나쁨"이다', () => {
        expect(Pm10GradeEnum.BAD.label).toBe('나쁨')
    })

    it('VERY_BAD의 label이 "매우나쁨"이다', () => {
        expect(Pm10GradeEnum.VERY_BAD.label).toBe('매우나쁨')
    })

    it('GOOD의 color에 rgba가 포함된다', () => {
        expect(Pm10GradeEnum.GOOD.color).toMatch(/^rgba\(/)
    })

    it('VERY_BAD의 color에 rgba가 포함된다', () => {
        expect(Pm10GradeEnum.VERY_BAD.color).toMatch(/^rgba\(/)
    })

    it('각 등급의 color가 서로 다르다', () => {
        const colors = [
            Pm10GradeEnum.GOOD.color,
            Pm10GradeEnum.MODERATE.color,
            Pm10GradeEnum.BAD.color,
            Pm10GradeEnum.VERY_BAD.color
        ]
        const unique = new Set(colors)
        expect(unique.size).toBe(4)
    })
})

// ─── fromPm25Value() ─────────────────────────────────────────────────────

describe('Pm10GradeEnum.fromPm25Value()', () => {
    it('0µg/m³ → GOOD', () => {
        expect(Pm10GradeEnum.fromPm25Value(0)).toBe(Pm10GradeEnum.GOOD)
    })

    it('15µg/m³(경계값) → GOOD', () => {
        expect(Pm10GradeEnum.fromPm25Value(15)).toBe(Pm10GradeEnum.GOOD)
    })

    it('16µg/m³(경계값+1) → MODERATE', () => {
        expect(Pm10GradeEnum.fromPm25Value(16)).toBe(Pm10GradeEnum.MODERATE)
    })

    it('35µg/m³(경계값) → MODERATE', () => {
        expect(Pm10GradeEnum.fromPm25Value(35)).toBe(Pm10GradeEnum.MODERATE)
    })

    it('36µg/m³(경계값+1) → BAD', () => {
        expect(Pm10GradeEnum.fromPm25Value(36)).toBe(Pm10GradeEnum.BAD)
    })

    it('75µg/m³(경계값) → BAD', () => {
        expect(Pm10GradeEnum.fromPm25Value(75)).toBe(Pm10GradeEnum.BAD)
    })

    it('76µg/m³(경계값+1) → VERY_BAD', () => {
        expect(Pm10GradeEnum.fromPm25Value(76)).toBe(Pm10GradeEnum.VERY_BAD)
    })

    it('999µg/m³(매우 높음) → VERY_BAD', () => {
        expect(Pm10GradeEnum.fromPm25Value(999)).toBe(Pm10GradeEnum.VERY_BAD)
    })
})

// ─── composite() ─────────────────────────────────────────────────────────

describe('Pm10GradeEnum.composite()', () => {
    it('둘 다 null이면 null을 반환한다', () => {
        expect(Pm10GradeEnum.composite(null, null)).toBeNull()
    })

    it('PM10만 있으면 PM10 등급을 반환한다', () => {
        const result = Pm10GradeEnum.composite(Pm10GradeEnum.MODERATE, null)
        expect(result).toBe(Pm10GradeEnum.MODERATE)
    })

    it('PM2.5만 있으면 PM2.5 등급을 반환한다', () => {
        expect(Pm10GradeEnum.composite(null, Pm10GradeEnum.BAD)).toBe(Pm10GradeEnum.BAD)
    })

    it('PM10이 더 나쁘면 PM10 등급을 반환한다', () => {
        expect(Pm10GradeEnum.composite(Pm10GradeEnum.VERY_BAD, Pm10GradeEnum.GOOD)).toBe(
            Pm10GradeEnum.VERY_BAD
        )
    })

    it('PM2.5가 더 나쁘면 PM2.5 등급을 반환한다', () => {
        expect(Pm10GradeEnum.composite(Pm10GradeEnum.GOOD, Pm10GradeEnum.BAD)).toBe(
            Pm10GradeEnum.BAD
        )
    })

    it('등급이 동일하면 해당 등급을 반환한다', () => {
        expect(Pm10GradeEnum.composite(Pm10GradeEnum.MODERATE, Pm10GradeEnum.MODERATE)).toBe(
            Pm10GradeEnum.MODERATE
        )
    })

    it('GOOD + VERY_BAD → VERY_BAD (합집합 규칙)', () => {
        expect(Pm10GradeEnum.composite(Pm10GradeEnum.GOOD, Pm10GradeEnum.VERY_BAD)).toBe(
            Pm10GradeEnum.VERY_BAD
        )
    })
})
