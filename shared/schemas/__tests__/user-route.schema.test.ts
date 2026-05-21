import { describe, it, expect } from 'vitest'
import { userPaceSchema, createUserPaceSchema } from '#shared/schemas/user-route.schema'

describe('userPaceSchema', () => {
    it('필수 id 3종으로 파싱한다', () => {
        const result = userPaceSchema.parse({
            userPaceId: 'p-1',
            userRouteId: 'ur-1',
            sectionId: 's-1'
        })
        expect(result.userPaceId).toBe('p-1')
    })

    it('선택 필드 pace/weight/strategy 를 허용한다', () => {
        const result = userPaceSchema.parse({
            userPaceId: 'p-1',
            userRouteId: 'ur-1',
            sectionId: 's-1',
            pace: 300,
            weight: 0.5,
            strategy: 'fast'
        })
        expect(result.pace).toBe(300)
        expect(result.weight).toBe(0.5)
        expect(result.strategy).toBe('fast')
    })

    it('pace 가 정수가 아니면 실패', () => {
        expect(() =>
            userPaceSchema.parse({
                userPaceId: 'p-1',
                userRouteId: 'ur-1',
                sectionId: 's-1',
                pace: 1.5
            })
        ).toThrow()
    })

    it('필수 id 누락 시 실패', () => {
        expect(() => userPaceSchema.parse({ userPaceId: 'p-1' })).toThrow()
    })
})

describe('createUserPaceSchema', () => {
    it('userPaceId 와 userRouteId 는 omit 되어 sectionId 만 필수', () => {
        const result = createUserPaceSchema.parse({ sectionId: 's-1' })
        expect(result.sectionId).toBe('s-1')
    })

    it('sectionId 가 없으면 실패', () => {
        expect(() => createUserPaceSchema.parse({})).toThrow()
    })
})
