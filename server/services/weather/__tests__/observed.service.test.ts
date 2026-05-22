import { describe, it, expect, vi, beforeEach } from 'vitest'

import { ObservedService } from '../observed.service'

const { fetchSlots } = vi.hoisted(() => ({ fetchSlots: vi.fn() }))
vi.mock('../observed.adapter', () => ({
    ObservedWeatherAdapter: class {
        fetchSlots = fetchSlots
    }
}))

describe('ObservedService', () => {
    beforeEach(() => {
        fetchSlots.mockReset()
    })

    it('빈 authKey → slots=[], error=null (fetch 호출 안 함)', async () => {
        const result = await new ObservedService().fetch('  ', new Date(), new Date())

        expect(result).toEqual({ slots: [], error: null })
        expect(fetchSlots).not.toHaveBeenCalled()
    })

    it('정상 응답 → slots 전달', async () => {
        const slots = [{ date: '2026-05-22', time: '10:00' }] as any
        fetchSlots.mockResolvedValue(slots)

        const result = await new ObservedService().fetch('key', new Date(), new Date())

        expect(result).toEqual({ slots, error: null })
    })

    it('adapter throw → slots=[] + error.source=observed', async () => {
        fetchSlots.mockRejectedValue(new Error('upstream'))

        const result = await new ObservedService().fetch('key', new Date(), new Date())

        expect(result.slots).toEqual([])
        expect(result.error?.source).toBe('observed')
    })
})
