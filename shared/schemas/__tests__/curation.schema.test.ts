import { describe, it, expect } from 'vitest'
import {
    createCurationCollectionSchema,
    createCurationRouteSchema
} from '#shared/schemas/curation.schema'

describe('createCurationCollectionSchema', () => {
    const validInput = {
        title: '벚꽃 절정 코스',
        season: 'spring' as const,
        theme: 'cherry-blossom' as const,
        validFrom: '2026-03-25',
        validTo: '2026-04-10'
    }

    it('유효한 입력을 파싱한다', () => {
        const result = createCurationCollectionSchema.parse(validInput)
        expect(result.title).toBe('벚꽃 절정 코스')
        expect(result.season).toBe('spring')
        expect(result.theme).toBe('cherry-blossom')
    })

    it('잘못된 시즌은 실패', () => {
        expect(() =>
            createCurationCollectionSchema.parse({ ...validInput, season: 'rainy' })
        ).toThrow()
    })

    it('잘못된 테마는 실패', () => {
        expect(() =>
            createCurationCollectionSchema.parse({ ...validInput, theme: 'beach' })
        ).toThrow()
    })

    it('날짜 형식이 맞아야 함', () => {
        expect(() =>
            createCurationCollectionSchema.parse({ ...validInput, validFrom: '2026/03/25' })
        ).toThrow()
    })

    it('coverImageUrl 은 유효한 URL이어야 함', () => {
        const result = createCurationCollectionSchema.parse({
            ...validInput,
            coverImageUrl: 'https://example.com/img.jpg'
        })
        expect(result.coverImageUrl).toContain('example.com')

        expect(() =>
            createCurationCollectionSchema.parse({ ...validInput, coverImageUrl: 'not-a-url' })
        ).toThrow()
    })
})

describe('createCurationRouteSchema', () => {
    const validInput = {
        routeId: 'route-abc',
        sortOrder: 0
    }

    it('유효한 최소 입력을 파싱한다', () => {
        const result = createCurationRouteSchema.parse(validInput)
        expect(result.routeId).toBe('route-abc')
        expect(result.sortOrder).toBe(0)
    })

    it('recommendedHourLocal 은 0~23', () => {
        expect(
            createCurationRouteSchema.parse({ ...validInput, recommendedHourLocal: 18 })
                .recommendedHourLocal
        ).toBe(18)
        expect(() =>
            createCurationRouteSchema.parse({ ...validInput, recommendedHourLocal: 24 })
        ).toThrow()
        expect(() =>
            createCurationRouteSchema.parse({ ...validInput, recommendedHourLocal: -1 })
        ).toThrow()
    })

    it('note 는 200자 이내', () => {
        expect(() =>
            createCurationRouteSchema.parse({ ...validInput, note: 'a'.repeat(201) })
        ).toThrow()
    })
})
