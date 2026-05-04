import { describe, it, expect } from 'vitest'
import { mapPm10Grade, mapPm25Grade } from '../common'

// ─── mapPm25Grade() ──────────────────────────────────────────────────────

describe('mapPm25Grade()', () => {
    it('15µg/m³(경계값) → good', () => {
        expect(mapPm25Grade(15)).toBe('good')
    })

    it('16µg/m³ → moderate', () => {
        expect(mapPm25Grade(16)).toBe('moderate')
    })

    it('35µg/m³(경계값) → moderate', () => {
        expect(mapPm25Grade(35)).toBe('moderate')
    })

    it('36µg/m³ → bad', () => {
        expect(mapPm25Grade(36)).toBe('bad')
    })

    it('75µg/m³(경계값) → bad', () => {
        expect(mapPm25Grade(75)).toBe('bad')
    })

    it('76µg/m³ → very-bad', () => {
        expect(mapPm25Grade(76)).toBe('very-bad')
    })
})

// ─── mapPm10Grade()와 mapPm25Grade()의 일관성 ────────────────────────────

describe('mapPm10Grade()와 mapPm25Grade()의 반환 타입 일관성', () => {
    it('PM10 등급 키가 유효한 Pm10Grade 타입이다', () => {
        const validKeys = ['good', 'moderate', 'bad', 'very-bad']
        expect(validKeys).toContain(mapPm10Grade(10))
        expect(validKeys).toContain(mapPm10Grade(50))
        expect(validKeys).toContain(mapPm10Grade(100))
        expect(validKeys).toContain(mapPm10Grade(200))
    })

    it('PM2.5 등급 키가 유효한 Pm10Grade 타입이다', () => {
        const validKeys = ['good', 'moderate', 'bad', 'very-bad']
        expect(validKeys).toContain(mapPm25Grade(5))
        expect(validKeys).toContain(mapPm25Grade(25))
        expect(validKeys).toContain(mapPm25Grade(50))
        expect(validKeys).toContain(mapPm25Grade(100))
    })
})
