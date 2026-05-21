import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OsrmRoutingService, osrmServiceFactory } from '../osrm.service'

const okJson = (data: unknown) => ({ ok: true, json: async () => data }) as any

describe('OsrmRoutingService', () => {
    beforeEach(() => vi.restoreAllMocks())

    it('isAvailable 항상 true', () => {
        expect(new OsrmRoutingService().isAvailable()).toBe(true)
    })

    it('osrmServiceFactory 는 OsrmRoutingService 인스턴스 반환', () => {
        expect(osrmServiceFactory({} as any)).toBeInstanceOf(OsrmRoutingService)
    })

    it('Ok 응답을 파싱해 좌표 반환', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            okJson({
                code: 'Ok',
                routes: [
                    {
                        geometry: {
                            type: 'LineString',
                            coordinates: [
                                [127.0, 37.5],
                                [127.01, 37.51]
                            ]
                        },
                        distance: 100,
                        duration: 60
                    }
                ]
            })
        )
        const svc = new OsrmRoutingService()
        const out = await svc.optimize([
            [127.0, 37.5, 0],
            [127.01, 37.51, 10]
        ])
        expect(fetchSpy).toHaveBeenCalledOnce()
        expect(out).toHaveLength(2)
        expect(out[0]?.[0]).toBe(127.0)
    })

    it('code != Ok 면 parseCoords 가 빈 배열 → 원본 반환', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(okJson({ code: 'NoRoute', routes: [] }))
        const svc = new OsrmRoutingService()
        const positions = [
            [127.0, 37.5, 0] as [number, number, number],
            [127.01, 37.51, 10] as [number, number, number]
        ]
        await expect(svc.optimize(positions)).resolves.toEqual(positions)
    })

    it('routes 비어있어도 빈 배열 처리', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(okJson({ code: 'Ok', routes: [] }))
        const svc = new OsrmRoutingService()
        const positions = [
            [127.0, 37.5, 0] as [number, number, number],
            [127.01, 37.51, 10] as [number, number, number]
        ]
        await expect(svc.optimize(positions)).resolves.toEqual(positions)
    })
})
