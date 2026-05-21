import { describe, it, expect } from 'vitest'
import { routeDiscoverFilterSchema } from '#shared/schemas/discover.schema'

describe('routeDiscoverFilterSchema', () => {
    it('모든 필드가 비어 있어도 통과한다', () => {
        const result = routeDiscoverFilterSchema.parse({})
        expect(result).toEqual({})
    })

    it('유효한 sortBy 와 district 를 파싱한다', () => {
        const result = routeDiscoverFilterSchema.parse({
            district: '강남구',
            sortBy: 'popular'
        })
        expect(result.district).toBe('강남구')
        expect(result.sortBy).toBe('popular')
    })

    it('sortBy 가 enum 외 값이면 실패', () => {
        expect(() => routeDiscoverFilterSchema.parse({ sortBy: 'foo' })).toThrow()
    })

    it('limit 은 문자열도 number 로 coerce 한다', () => {
        const result = routeDiscoverFilterSchema.parse({ limit: '20' })
        expect(result.limit).toBe(20)
    })

    it('limit 이 0 이하이면 실패', () => {
        expect(() => routeDiscoverFilterSchema.parse({ limit: 0 })).toThrow()
        expect(() => routeDiscoverFilterSchema.parse({ limit: -5 })).toThrow()
    })

    it('limit 이 100 초과면 실패', () => {
        expect(() => routeDiscoverFilterSchema.parse({ limit: 101 })).toThrow()
    })

    it('limit 이 정수가 아니면 실패', () => {
        expect(() => routeDiscoverFilterSchema.parse({ limit: 1.5 })).toThrow()
    })
})
