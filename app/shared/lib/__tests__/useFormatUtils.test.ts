import { describe, it, expect } from 'vitest'
import { formatDistance, formatElevation } from '~/shared/lib/useFormatUtils'

// ─── formatDistance ───────────────────────────────────────────────────────
describe('formatDistance', () => {
    it('1km 미만이면 m 단위로 반환한다', () => {
        expect(formatDistance(0.5)).toBe('500m')
    })

    it('1km 이상이면 소수점 1자리 km 단위로 반환한다', () => {
        expect(formatDistance(1)).toBe('1.0km')
        expect(formatDistance(5.678)).toBe('5.7km')
    })

    it('0이면 "0m"를 반환한다', () => {
        expect(formatDistance(0)).toBe('0m')
    })

    it('정확히 1km이면 "1.0km"를 반환한다', () => {
        expect(formatDistance(1.0)).toBe('1.0km')
    })

    it('0.9999km이면 m로 반환한다', () => {
        expect(formatDistance(0.9999)).toBe('1000m')
    })

    it('undefined이면 fallback 기본값("")을 반환한다', () => {
        expect(formatDistance(undefined)).toBe('')
    })

    it('NaN이면 fallback을 반환한다', () => {
        expect(formatDistance(NaN)).toBe('')
    })

    it('커스텀 fallback을 지정할 수 있다', () => {
        expect(formatDistance(undefined, '-')).toBe('-')
        expect(formatDistance(NaN, '?')).toBe('?')
    })

    it('음수 거리도 처리한다', () => {
        // Math.round(-500 * 1000) = -500000m... 실제로는 음수 km를 그냥 처리
        expect(formatDistance(-0.5)).toBe('-500m')
    })
})

// ─── formatElevation ──────────────────────────────────────────────────────
describe('formatElevation', () => {
    it('정수 고도를 소수점 1자리 m 문자열로 반환한다', () => {
        expect(formatElevation(100)).toBe('100.0m')
    })

    it('소수점 고도를 1자리로 반올림한다', () => {
        expect(formatElevation(12.345)).toBe('12.3m')
        expect(formatElevation(12.356)).toBe('12.4m')
    })

    it('0이면 "0.0m"를 반환한다', () => {
        expect(formatElevation(0)).toBe('0.0m')
    })

    it('undefined이면 기본 fallback "0.0m"를 반환한다', () => {
        expect(formatElevation(undefined)).toBe('0.0m')
    })

    it('NaN이면 fallback을 반환한다', () => {
        expect(formatElevation(NaN)).toBe('0.0m')
    })

    it('커스텀 fallback을 지정할 수 있다', () => {
        expect(formatElevation(undefined, '-m')).toBe('-m')
    })

    it('음수 고도도 올바르게 포맷한다', () => {
        expect(formatElevation(-5.5)).toBe('-5.5m')
    })
})
