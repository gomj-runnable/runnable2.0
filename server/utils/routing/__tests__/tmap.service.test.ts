import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TMapRoutingService, tmapServiceFactory } from '../tmap.service'

const okJson = (data: unknown) => ({ ok: true, json: async () => data }) as any

describe('TMapRoutingService', () => {
    beforeEach(() => vi.restoreAllMocks())

    it('isAvailable 는 apiKey 유무로 결정', () => {
        expect(new TMapRoutingService('').isAvailable()).toBe(false)
        expect(new TMapRoutingService('key').isAvailable()).toBe(true)
    })

    it('tmapServiceFactory 는 config.tmapApi 기본값 빈 문자열', () => {
        expect(tmapServiceFactory({}).isAvailable()).toBe(false)
        expect(tmapServiceFactory({ tmapApi: 'k' }).isAvailable()).toBe(true)
    })

    it('appKey 헤더와 startX/startY/endX/endY 본문을 가진 POST 요청', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            okJson({
                type: 'FeatureCollection',
                features: [
                    {
                        geometry: {
                            type: 'LineString',
                            coordinates: [
                                [127.0, 37.5],
                                [127.01, 37.51]
                            ]
                        }
                    }
                ]
            })
        )

        const svc = new TMapRoutingService('test-key')
        await svc.optimize([
            [127.0, 37.5, 0],
            [127.01, 37.51, 10]
        ])

        expect(fetchSpy).toHaveBeenCalledOnce()
        const [url, init] = fetchSpy.mock.calls[0]!
        expect(String(url)).toContain('tmap')
        expect((init as any).method).toBe('POST')
        expect((init as any).headers.appKey).toBe('test-key')
        const body = JSON.parse((init as any).body)
        expect(body.startX).toBe(127.0)
        expect(body.endY).toBe(37.51)
    })

    it('waypoints 가 있으면 passList 가 본문에 포함', async () => {
        const fetchSpy = vi
            .spyOn(globalThis, 'fetch')
            .mockResolvedValue(okJson({ type: 'FeatureCollection', features: [] }))
        const svc = new TMapRoutingService('k')
        await svc.optimize([
            [127.0, 37.5, 0],
            [127.005, 37.505, 5],
            [127.01, 37.51, 10]
        ])
        const body = JSON.parse((fetchSpy.mock.calls[0]![1] as any).body)
        expect(body.passList).toBe('127.005,37.505')
    })

    it('Point geometry 는 무시하고 LineString 만 합친다', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            okJson({
                type: 'FeatureCollection',
                features: [
                    {
                        geometry: {
                            type: 'LineString',
                            coordinates: [
                                [1, 1],
                                [2, 2]
                            ]
                        }
                    },
                    { geometry: { type: 'Point', coordinates: [3, 3] } }
                ]
            })
        )
        const svc = new TMapRoutingService('k')
        const result = await svc.optimize([
            [1, 1, 0],
            [2, 2, 10]
        ])
        expect(result).toHaveLength(2)
        expect(result[0]?.[0]).toBe(1)
    })

    it('features 누락이면 parseCoords 빈 배열 → 원본', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(okJson({}))
        const svc = new TMapRoutingService('k')
        const positions = [
            [1, 1, 0] as [number, number, number],
            [2, 2, 10] as [number, number, number]
        ]
        await expect(svc.optimize(positions)).resolves.toEqual(positions)
    })
})
