import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../index.put'

const { getRouteById, updateRouteWithSections, requireSession } = vi.hoisted(() => ({
    getRouteById: vi.fn(),
    updateRouteWithSections: vi.fn(),
    requireSession: vi.fn()
}))
vi.mock('../../../../services/route.service', () => ({
    routeService: { getRouteById, updateRouteWithSections }
}))
vi.mock('../../../../security/auth/service', () => ({
    auth: { requireSession }
}))

const makeEvent = (routeId: string | undefined, body: any) =>
    ({ context: { params: { routeId } }, body, method: 'PUT', path: '/api/routes/r-1' }) as any

describe('PUT /api/routes/[routeId]', () => {
    beforeEach(() => {
        getRouteById.mockReset()
        updateRouteWithSections.mockReset()
        requireSession.mockReset().mockResolvedValue({ userId: 'me' })
    })

    it('routeId 누락 시 400', async () => {
        await expect(handler(makeEvent(undefined, {}))).rejects.toMatchObject({ statusCode: 400 })
    })

    it('경로 없으면 404', async () => {
        getRouteById.mockResolvedValue(null)

        await expect(handler(makeEvent('r-1', {}))).rejects.toMatchObject({ statusCode: 404 })
    })

    it('소유자가 다르면 403', async () => {
        getRouteById.mockResolvedValue({ routeId: 'r-1', userId: 'other' })

        await expect(handler(makeEvent('r-1', {}))).rejects.toMatchObject({ statusCode: 403 })
    })

    it('소유자 + 유효한 body 면 updateRouteWithSections 위임', async () => {
        getRouteById.mockResolvedValue({ routeId: 'r-1', userId: 'me' })
        const updated = { routeId: 'r-1', title: 'updated' }
        updateRouteWithSections.mockResolvedValue(updated)

        const result = await handler(
            makeEvent('r-1', {
                route: { title: 'updated' },
                sections: undefined
            })
        )

        expect(updateRouteWithSections).toHaveBeenCalledWith('r-1', { title: 'updated' }, undefined)
        expect(result).toBe(updated)
    })

    it('zod 위반 (title 빈 문자열) → withExceptionHandler 가 400', async () => {
        getRouteById.mockResolvedValue({ routeId: 'r-1', userId: 'me' })

        await expect(handler(makeEvent('r-1', { route: { title: '' } }))).rejects.toMatchObject({
            statusCode: 400
        })
        expect(updateRouteWithSections).not.toHaveBeenCalled()
    })
})
