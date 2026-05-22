import { describe, it, expect } from 'vitest'
import { useCameraStore } from '../useCameraStore'

describe('useCameraStore', () => {
    it('초기값: 모두 null + altitudeLabel="-"', () => {
        const s = useCameraStore()
        expect(s.altitude.value).toBeNull()
        expect(s.altitudeLabel.value).toBe('-')
        expect(s.footerLabel.value).toContain('-')
    })

    it('altitudeLabel: 1000m 미만은 m, 이상은 km(소수 2자리)', () => {
        const s = useCameraStore()
        s.altitude.value = 999
        expect(s.altitudeLabel.value).toBe('999m')

        s.altitude.value = 1500
        expect(s.altitudeLabel.value).toBe('1.50km')

        s.altitude.value = 250.7
        expect(s.altitudeLabel.value).toBe('251m')
    })

    it('footerLabel: 위치 + 고도 + 방위 + 기울기 포함', () => {
        const s = useCameraStore()
        s.locationLabel.value = '서울시 강남구'
        s.altitude.value = 500
        s.heading.value = 45.7
        s.pitch.value = -30.3

        const label = s.footerLabel.value
        expect(label).toContain('서울시 강남구')
        expect(label).toContain('500m')
        expect(label).toContain('46°') // 반올림
        expect(label).toContain('30°') // 절댓값 + 반올림
    })
})
