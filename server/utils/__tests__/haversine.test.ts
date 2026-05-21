import { describe, it, expect } from 'vitest'
import { haversineDistance } from '../haversine'

describe('haversineDistance', () => {
    it('동일 좌표는 0 을 반환한다', () => {
        expect(haversineDistance(37.5, 127.0, 37.5, 127.0)).toBe(0)
    })

    it('약 1km 떨어진 좌표는 1000m 근처를 반환한다', () => {
        // 위도 1도 ≈ 111km. 0.009도 ≈ 1km
        const d = haversineDistance(37.5, 127.0, 37.509, 127.0)
        expect(d).toBeGreaterThan(990)
        expect(d).toBeLessThan(1010)
    })

    it('교환 법칙 — 두 점 순서를 바꿔도 거리는 동일', () => {
        const d1 = haversineDistance(37.5, 127.0, 35.1, 129.0)
        const d2 = haversineDistance(35.1, 129.0, 37.5, 127.0)
        expect(d1).toBeCloseTo(d2, 6)
    })

    it('서울-부산 직선 거리는 약 325km', () => {
        const d = haversineDistance(37.5665, 126.978, 35.1796, 129.0756)
        expect(d).toBeGreaterThan(320_000)
        expect(d).toBeLessThan(330_000)
    })
})
