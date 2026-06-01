import { describe, it, expect } from 'vitest'
import { requireRouteIdParam } from '../params'

describe('requireRouteIdParam', () => {
    it('routeId 가 있으면 그대로 반환', () => {
        const event = { context: { params: { routeId: 'r-1' } } } as any
        expect(requireRouteIdParam(event)).toBe('r-1')
    })

    it('routeId 가 없으면 400 에러', () => {
        const event = { context: { params: {} } } as any
        expect(() => requireRouteIdParam(event)).toThrow()
        try {
            requireRouteIdParam(event)
        } catch (e) {
            expect((e as any).statusCode).toBe(400)
        }
    })

    it('빈 문자열도 미존재로 간주', () => {
        const event = { context: { params: { routeId: '' } } } as any
        expect(() => requireRouteIdParam(event)).toThrow()
    })
})
