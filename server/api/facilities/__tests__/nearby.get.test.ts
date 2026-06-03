import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../nearby.get'

const { findNearby } = vi.hoisted(() => ({ findNearby: vi.fn() }))
vi.mock('../../../repositories', () => ({
    getFacilityRepository: vi.fn(async () => ({ findNearby }))
}))

const makeEvent = (query: Record<string, string>) =>
    ({ method: 'GET', path: '/api/facilities/nearby', query }) as any

describe('GET /api/facilities/nearby', () => {
    beforeEach(() => {
        findNearby.mockReset()
    })

    it('기본 radius 1000m 와 5가지 타입 전부로 findNearby 를 호출한다', async () => {
        const fixture = [{ id: 'f1', type: 'toilet' }]
        findNearby.mockResolvedValue(fixture)

        const result = await handler(makeEvent({ lat: '37.5', lng: '127.0' }))

        expect(findNearby).toHaveBeenCalledWith(37.5, 127.0, 1000, [
            'crosswalk',
            'fountain',
            'hospital',
            'toilet',
            'locker'
        ])
        expect(result).toBe(fixture)
    })

    it('types 쿼리에서 유효 타입만 필터링한다', async () => {
        findNearby.mockResolvedValue([])

        await handler(makeEvent({ lat: '37', lng: '127', types: 'toilet,invalid,hospital' }))

        expect(findNearby).toHaveBeenCalledWith(37, 127, 1000, ['toilet', 'hospital'])
    })

    it('radius 를 명시하면 그 값을 사용한다', async () => {
        findNearby.mockResolvedValue([])

        await handler(makeEvent({ lat: '37', lng: '127', radius: '2500' }))

        expect(findNearby).toHaveBeenCalledWith(37, 127, 2500, expect.any(Array))
    })

    it('lat/lng 누락 시 400 으로 변환된다 (withErrorHandler + ZodError)', async () => {
        await expect(handler(makeEvent({}))).rejects.toMatchObject({ statusCode: 400 })
        expect(findNearby).not.toHaveBeenCalled()
    })

    it('radius 가 상한(5000)을 넘으면 400', async () => {
        await expect(
            handler(makeEvent({ lat: '37', lng: '127', radius: '6000' }))
        ).rejects.toMatchObject({ statusCode: 400 })
    })

    it('lat 이 범위(-90~90) 밖이면 400', async () => {
        await expect(handler(makeEvent({ lat: '120', lng: '127' }))).rejects.toMatchObject({
            statusCode: 400
        })
    })
})
