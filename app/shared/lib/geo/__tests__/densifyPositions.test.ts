import { describe, it, expect } from 'vitest'
import { densifyPositions } from '../densifyPositions'

describe('densifyPositions', () => {
    it('포인트가 1개 이하면 그대로 반환', () => {
        expect(densifyPositions([])).toEqual([])
        const single: any = [[127, 37, 0]]
        const out = densifyPositions(single)
        expect(out).toEqual(single)
        expect(out).not.toBe(single) // 복사본
    })

    it('두 포인트 사이를 보간하고 마지막 포인트를 push', () => {
        const start = [127.0, 37.0] as any
        const end = [127.0, 37.001] as any // 약 111m
        const result = densifyPositions([start, end])

        // step 50m → 약 2~3개 보간점 + 마지막 1개
        expect(result.length).toBeGreaterThanOrEqual(3)
        // 모든 z 좌표는 0
        expect(result.every((p) => p[2] === 0)).toBe(true)
        // 마지막은 end 와 같은 lng/lat
        expect(result[result.length - 1]?.slice(0, 2)).toEqual([127.0, 37.001])
    })

    it('stepMeters 가 크면 보간점 개수 감소', () => {
        const positions = [
            [127.0, 37.0],
            [127.0, 37.01]
        ] as any
        const dense = densifyPositions(positions, 10) // 10m 간격
        const sparse = densifyPositions(positions, 500) // 500m 간격
        expect(dense.length).toBeGreaterThan(sparse.length)
    })
})
