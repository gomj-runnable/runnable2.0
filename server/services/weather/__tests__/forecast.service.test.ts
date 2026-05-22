import { describe, it, expect, vi, beforeEach } from 'vitest'

import { ForecastService } from '../forecast.service'

const { fetchSlots } = vi.hoisted(() => ({ fetchSlots: vi.fn() }))
vi.mock('../forecast.adapter', () => ({
    ForecastAdapter: class {
        fetchSlots = fetchSlots
    }
}))

describe('ForecastService', () => {
    beforeEach(() => {
        fetchSlots.mockReset()
    })

    it('빈 key → slots=[], error=null', async () => {
        const result = await new ForecastService().fetch('', '2026-05-22')
        expect(result).toEqual({ slots: [], error: null })
        expect(fetchSlots).not.toHaveBeenCalled()
    })

    it('정상 응답 → slots 반환', async () => {
        const slots = [{ date: '2026-05-22' }] as any
        fetchSlots.mockResolvedValue(slots)

        const result = await new ForecastService().fetch('k', '2026-05-22')
        expect(result.slots).toBe(slots)
        expect(result.error).toBeNull()
    })

    it('throw → forecast error', async () => {
        fetchSlots.mockRejectedValue(new Error('boom'))

        const result = await new ForecastService().fetch('k', '2026-05-22')
        expect(result.error?.source).toBe('forecast')
    })
})
