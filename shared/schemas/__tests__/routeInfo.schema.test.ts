import { describe, it, expect } from 'vitest'
import { createRouteInfoSchema } from '#shared/schemas/routeInfo.schema'

describe('createRouteInfoSchema', () => {
    const validInput = {
        name: '한강공원',
        description: '서울 한강 시민공원',
        geom: { type: 'Point' as const, coordinates: [127.05, 37.5] }
    }

    it('유효한 입력을 파싱한다', () => {
        const result = createRouteInfoSchema.parse(validInput)
        expect(result.name).toBe('한강공원')
        expect(result.geom.coordinates[0]).toBe(127.05)
        expect(result.geom.coordinates[1]).toBe(37.5)
    })

    it('고도(3D) 좌표도 허용', () => {
        const result = createRouteInfoSchema.parse({
            ...validInput,
            geom: { type: 'Point' as const, coordinates: [127.05, 37.5, 12] }
        })
        expect(result.geom.coordinates[2]).toBe(12)
    })

    it('name 이 빈 문자열이면 실패', () => {
        expect(() => createRouteInfoSchema.parse({ ...validInput, name: '' })).toThrow()
    })

    it('name 이 100자 초과이면 실패', () => {
        expect(() =>
            createRouteInfoSchema.parse({ ...validInput, name: 'a'.repeat(101) })
        ).toThrow()
    })

    it('description 이 빈 문자열이면 실패', () => {
        expect(() => createRouteInfoSchema.parse({ ...validInput, description: '' })).toThrow()
    })

    it('description 이 500자 초과이면 실패', () => {
        expect(() =>
            createRouteInfoSchema.parse({ ...validInput, description: 'a'.repeat(501) })
        ).toThrow()
    })

    it('geom 이 누락되면 실패', () => {
        expect(() => createRouteInfoSchema.parse({ name: 'x', description: 'd' })).toThrow()
    })

    it('geom coordinates 가 1개뿐이면 실패', () => {
        expect(() =>
            createRouteInfoSchema.parse({
                ...validInput,
                geom: { type: 'Point', coordinates: [127.05] }
            })
        ).toThrow()
    })
})
