import { describe, it, expect } from 'vitest'
import { toCoordString, interpolateHeights, AbstractRoutingService } from '../common'
import type { GeoJsonPosition } from '#shared/types/geojson'

describe('toCoordString', () => {
    it('"lng,lat" 형식 반환', () => {
        expect(toCoordString([127.05, 37.5, 10])).toBe('127.05,37.5')
    })
})

describe('interpolateHeights', () => {
    it('original 이 비어있으면 빈 배열', () => {
        expect(interpolateHeights([], [[1, 1]])).toEqual([])
    })

    it('optimized 가 비어있으면 빈 배열', () => {
        expect(interpolateHeights([[1, 1, 0]], [])).toEqual([])
    })

    it('동일 길이일 때 좌표는 새로 사용, 고도는 매핑', () => {
        const orig: GeoJsonPosition[] = [
            [0, 0, 100],
            [1, 1, 200]
        ]
        const opt: [number, number][] = [
            [10, 10],
            [11, 11]
        ]
        const result = interpolateHeights(orig, opt)
        expect(result).toHaveLength(2)
        expect(result[0]).toEqual([10, 10, 100])
        expect(result[1]).toEqual([11, 11, 200])
    })

    it('optimized 1개일 때 ratio 0', () => {
        const orig: GeoJsonPosition[] = [
            [0, 0, 50],
            [1, 1, 150]
        ]
        const result = interpolateHeights(orig, [[5, 5]])
        expect(result[0]?.[2]).toBe(50)
    })

    it('중간 지점 고도는 선형 보간', () => {
        const orig: GeoJsonPosition[] = [
            [0, 0, 0],
            [1, 1, 100]
        ]
        const opt: [number, number][] = [
            [0, 0],
            [0.5, 0.5],
            [1, 1]
        ]
        const result = interpolateHeights(orig, opt)
        expect(result[1]?.[2]).toBeCloseTo(50, 5)
    })
})

class FakeRouting extends AbstractRoutingService {
    constructor(
        private readonly response: Response,
        private readonly coords: [number, number][]
    ) {
        super()
    }
    isAvailable() {
        return true
    }
    protected async callApi(): Promise<Response> {
        return this.response
    }
    protected parseCoords(): [number, number][] {
        return this.coords
    }
}

class ErrorRouting extends AbstractRoutingService {
    isAvailable() {
        return true
    }
    protected async callApi(): Promise<Response> {
        throw new Error('network')
    }
    protected parseCoords(): [number, number][] {
        return []
    }
}

const okResponse = (data: unknown) => ({ ok: true, json: async () => data }) as any
const failResponse = () => ({ ok: false, status: 500, statusText: 'oops' }) as any

describe('AbstractRoutingService.optimize', () => {
    const positions: GeoJsonPosition[] = [
        [0, 0, 0],
        [1, 1, 100]
    ]

    it('positions 가 1개 이하면 그대로 반환', async () => {
        const svc = new FakeRouting(okResponse({}), [])
        await expect(svc.optimize([[0, 0, 0]])).resolves.toEqual([[0, 0, 0]])
    })

    it('성공 시 보간된 좌표 반환', async () => {
        const svc = new FakeRouting(okResponse({}), [
            [10, 10],
            [11, 11]
        ])
        const result = await svc.optimize(positions)
        expect(result).toHaveLength(2)
        expect(result[0]?.[0]).toBe(10)
    })

    it('parseCoords 가 빈 배열이면 원본 반환', async () => {
        const svc = new FakeRouting(okResponse({}), [])
        await expect(svc.optimize(positions)).resolves.toEqual(positions)
    })

    it('!response.ok 면 onError → throw (기본)', async () => {
        const svc = new FakeRouting(failResponse(), [])
        await expect(svc.optimize(positions)).rejects.toThrow(/Routing API error/)
    })

    it('callApi throw 도 onError 로 위임', async () => {
        const svc = new ErrorRouting()
        await expect(svc.optimize(positions)).rejects.toThrow('network')
    })
})
