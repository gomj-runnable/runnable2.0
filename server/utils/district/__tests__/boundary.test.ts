import { describe, it, expect, vi, beforeEach } from 'vitest'

const okJson = (data: unknown) => ({ ok: true, json: async () => data }) as any

describe('boundary fetch + 캐싱', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.restoreAllMocks()
    })

    it('getSggBoundary 는 fetch 결과를 반환', async () => {
        const fc = { type: 'FeatureCollection', features: [] }
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(okJson(fc))
        const { getSggBoundary } = await import('../boundary')
        const result = await getSggBoundary()
        expect(result).toEqual(fc)
        expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    it('getSggBoundary 는 두 번째 호출에서 캐시 사용 (fetch 1회)', async () => {
        const fc = { type: 'FeatureCollection', features: [] }
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(okJson(fc))
        const { getSggBoundary } = await import('../boundary')
        await getSggBoundary()
        await getSggBoundary()
        expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    it('getEmdBoundary 도 동일하게 캐싱', async () => {
        const fc = { type: 'FeatureCollection', features: [] }
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(okJson(fc))
        const { getEmdBoundary } = await import('../boundary')
        await getEmdBoundary()
        await getEmdBoundary()
        expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    it('fetch !ok 이면 throw', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false } as any)
        const { getSggBoundary } = await import('../boundary')
        await expect(getSggBoundary()).rejects.toThrow(/Failed to fetch/)
    })
})
