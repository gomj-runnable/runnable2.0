import { describe, it, expect } from 'vitest'
import {
    haversineDistance,
    calcTotalDistance,
    interpolatePath,
    getProgressInfo
} from '~/features/camera/lib/useFlythroughAction'

// ─── haversineDistance ────────────────────────────────────────────────────
describe('haversineDistance', () => {
    it('동일한 좌표 간 거리는 0이다', () => {
        expect(haversineDistance([127.0, 37.5], [127.0, 37.5])).toBe(0)
    })

    it('서울 시청에서 약 1km 떨어진 지점까지 거리가 대략 맞다', () => {
        // 서울 시청 [126.977, 37.5665] → 동쪽으로 약 1km
        const dist = haversineDistance([126.977, 37.5665], [126.9882, 37.5665])
        expect(dist).toBeGreaterThan(900)
        expect(dist).toBeLessThan(1300)
    })

    it('적도 위 1도 경도 차이는 약 111km이다', () => {
        const dist = haversineDistance([0, 0], [1, 0])
        expect(dist).toBeGreaterThan(110000)
        expect(dist).toBeLessThan(112000)
    })

    it('거리는 음수가 아니다', () => {
        expect(haversineDistance([130, 38], [127, 37])).toBeGreaterThanOrEqual(0)
    })
})

// ─── calcTotalDistance ────────────────────────────────────────────────────
describe('calcTotalDistance', () => {
    it('좌표가 1개 이하이면 0을 반환한다', () => {
        expect(calcTotalDistance([[127, 37, 0]])).toBe(0)
        expect(calcTotalDistance([])).toBe(0)
    })

    it('두 좌표의 총 거리는 haversineDistance와 같다', () => {
        const a = [126.977, 37.5665, 0]
        const b = [126.9882, 37.5665, 0]
        const expected = haversineDistance(a, b)
        expect(calcTotalDistance([a, b])).toBeCloseTo(expected, 5)
    })

    it('세 좌표의 총 거리는 각 구간 합산과 같다', () => {
        const a = [126.977, 37.5665, 0]
        const b = [126.9882, 37.5665, 0]
        const c = [126.9990, 37.5665, 0]
        const expected = haversineDistance(a, b) + haversineDistance(b, c)
        expect(calcTotalDistance([a, b, c])).toBeCloseTo(expected, 5)
    })
})

// ─── interpolatePath ──────────────────────────────────────────────────────
describe('interpolatePath', () => {
    it('빈 배열이면 기본값(0, 0, 0, heading:0, pitch:-15)을 반환한다', () => {
        const pos = interpolatePath([], 0.5)
        expect(pos).toEqual({ longitude: 0, latitude: 0, elevation: 0, heading: 0, pitch: -15 })
    })

    it('좌표가 1개이면 해당 좌표에 눈높이 +2m 오프셋이 적용된다', () => {
        const pos = interpolatePath([[127, 37, 10]], 0.5)
        expect(pos.longitude).toBe(127)
        expect(pos.latitude).toBe(37)
        expect(pos.elevation).toBe(12)
        expect(pos.pitch).toBe(-15)
    })

    it('progress=0이면 첫 번째 포인트에 위치한다', () => {
        const coords = [[126.977, 37.5665, 0], [126.9882, 37.5665, 10]]
        const pos = interpolatePath(coords, 0)
        expect(pos.longitude).toBeCloseTo(126.977, 3)
        expect(pos.latitude).toBeCloseTo(37.5665, 3)
    })

    it('progress=1이면 마지막 포인트에 위치한다', () => {
        const coords = [[126.977, 37.5665, 0], [126.9882, 37.5665, 10]]
        const pos = interpolatePath(coords, 1)
        expect(pos.longitude).toBeCloseTo(126.9882, 3)
        expect(pos.latitude).toBeCloseTo(37.5665, 3)
    })

    it('pitch는 항상 -15이다', () => {
        const coords = [[126.977, 37.5665, 0], [126.9882, 37.5665, 10]]
        expect(interpolatePath(coords, 0.5).pitch).toBe(-15)
    })

    it('눈높이 오프셋(+2m)이 elevation에 적용된다', () => {
        const coords = [[126.977, 37.5665, 5], [126.9882, 37.5665, 5]]
        // 중간 지점의 고도는 5 + 2 = 7
        const pos = interpolatePath(coords, 0.5)
        expect(pos.elevation).toBeCloseTo(7, 1)
    })

    it('progress가 0보다 작으면 0으로 클램핑된다', () => {
        const coords = [[126.977, 37.5665, 0], [126.9882, 37.5665, 0]]
        const posNeg = interpolatePath(coords, -0.5)
        const pos0 = interpolatePath(coords, 0)
        expect(posNeg.longitude).toBeCloseTo(pos0.longitude, 5)
    })

    it('progress가 1보다 크면 1로 클램핑된다', () => {
        const coords = [[126.977, 37.5665, 0], [126.9882, 37.5665, 0]]
        const posOver = interpolatePath(coords, 1.5)
        const pos1 = interpolatePath(coords, 1)
        expect(posOver.longitude).toBeCloseTo(pos1.longitude, 5)
    })
})

// ─── getProgressInfo ──────────────────────────────────────────────────────
describe('getProgressInfo', () => {
    it('빈 배열이면 모든 값이 0인 객체를 반환한다', () => {
        expect(getProgressInfo([], 0.5)).toEqual({
            distanceFromStart: 0,
            currentElevation: 0,
            currentGradient: 0,
            totalDistance: 0,
            progress: 0
        })
    })

    it('totalDistance는 calcTotalDistance와 같다', () => {
        const coords = [[126.977, 37.5665, 0], [126.9882, 37.5665, 0]]
        const info = getProgressInfo(coords, 0)
        expect(info.totalDistance).toBeCloseTo(calcTotalDistance(coords), 5)
    })

    it('progress=0이면 distanceFromStart는 0이다', () => {
        const coords = [[126.977, 37.5665, 0], [126.9882, 37.5665, 10]]
        const info = getProgressInfo(coords, 0)
        expect(info.distanceFromStart).toBe(0)
    })

    it('progress=1이면 distanceFromStart는 totalDistance와 같다', () => {
        const coords = [[126.977, 37.5665, 0], [126.9882, 37.5665, 10]]
        const info = getProgressInfo(coords, 1)
        expect(info.distanceFromStart).toBeCloseTo(info.totalDistance, 5)
    })

    it('progress 값이 반환된 progress 필드와 일치한다', () => {
        const coords = [[126.977, 37.5665, 0], [126.9882, 37.5665, 0]]
        expect(getProgressInfo(coords, 0.5).progress).toBe(0.5)
    })

    it('progress가 0보다 작으면 0으로 클램핑된다', () => {
        const coords = [[126.977, 37.5665, 0], [126.9882, 37.5665, 0]]
        expect(getProgressInfo(coords, -1).progress).toBe(0)
    })

    it('progress가 1보다 크면 1로 클램핑된다', () => {
        const coords = [[126.977, 37.5665, 0], [126.9882, 37.5665, 0]]
        expect(getProgressInfo(coords, 2).progress).toBe(1)
    })

    it('고도가 있는 경로에서 currentElevation이 보간된다', () => {
        // 고도가 0에서 100으로 올라가는 경로의 중간지점 → 약 50m
        const coords = [[126.977, 37.5665, 0], [126.9882, 37.5665, 100]]
        const info = getProgressInfo(coords, 0.5)
        expect(info.currentElevation).toBeGreaterThan(40)
        expect(info.currentElevation).toBeLessThan(60)
    })
})
