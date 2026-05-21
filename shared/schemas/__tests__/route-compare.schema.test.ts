import { describe, it, expect } from 'vitest'
import { routeCompareQuerySchema } from '#shared/schemas/route-compare.schema'

describe('routeCompareQuerySchema', () => {
    it('두 routeId 를 파싱한다', () => {
        const result = routeCompareQuerySchema.parse({
            routeA: 'route-a',
            routeB: 'route-b'
        })
        expect(result.routeA).toBe('route-a')
        expect(result.routeB).toBe('route-b')
    })

    it('routeA 가 빈 문자열이면 실패', () => {
        expect(() => routeCompareQuerySchema.parse({ routeA: '', routeB: 'b' })).toThrow()
    })

    it('routeB 가 빈 문자열이면 실패', () => {
        expect(() => routeCompareQuerySchema.parse({ routeA: 'a', routeB: '' })).toThrow()
    })

    it('한쪽이 누락되면 실패', () => {
        expect(() => routeCompareQuerySchema.parse({ routeA: 'a' })).toThrow()
    })
})
