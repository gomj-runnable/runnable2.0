import { describe, it, expect, vi, beforeEach } from 'vitest'

import { AirQualityService } from '../airquality.service'

const { fetchSeoulAirQuality } = vi.hoisted(() => ({ fetchSeoulAirQuality: vi.fn() }))
vi.mock('../airquality.adapter', () => ({
    AirQualityAdapter: class {
        fetchSeoulAirQuality = fetchSeoulAirQuality
    }
}))

describe('AirQualityService', () => {
    beforeEach(() => {
        fetchSeoulAirQuality.mockReset()
    })

    it('빈 key → 빈 Map + null error', async () => {
        const result = await new AirQualityService().fetch('')
        expect(result.dataByGu.size).toBe(0)
        expect(result.error).toBeNull()
        expect(fetchSeoulAirQuality).not.toHaveBeenCalled()
    })

    it('성공 시 dataByGu Map 반환', async () => {
        const map = new Map([['11010', []]])
        fetchSeoulAirQuality.mockResolvedValue(map)

        const result = await new AirQualityService().fetch('k')
        expect(result.dataByGu).toBe(map)
        expect(result.error).toBeNull()
    })

    it('Error 인스턴스 throw → error.message 가 그대로 노출', async () => {
        fetchSeoulAirQuality.mockRejectedValue(new Error('rate-limited'))

        const result = await new AirQualityService().fetch('k')
        expect(result.error?.source).toBe('airquality')
        expect(result.error?.message).toBe('rate-limited')
    })

    it('non-Error throw 도 string 으로 변환', async () => {
        fetchSeoulAirQuality.mockRejectedValue('string-err')

        const result = await new AirQualityService().fetch('k')
        expect(result.error?.message).toBe('string-err')
    })
})
