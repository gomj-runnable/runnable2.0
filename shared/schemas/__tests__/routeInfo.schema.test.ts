import { describe, it, expect } from 'vitest'
import { createRouteInfoSchema } from '#shared/schemas/routeInfo.schema'

describe('createRouteInfoSchema', () => {
    const validInput = {
        name: '한강공원',
        description: '서울 한강 시민공원',
        lng: 127.05,
        lat: 37.5
    }

    it('유효한 입력을 파싱한다', () => {
        const result = createRouteInfoSchema.parse(validInput)
        expect(result.name).toBe('한강공원')
        expect(result.lng).toBe(127.05)
        expect(result.lat).toBe(37.5)
    })

    it('elevation 은 선택 사항', () => {
        const result = createRouteInfoSchema.parse({ ...validInput, elevation: 12 })
        expect(result.elevation).toBe(12)
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

    it('lng/lat 가 누락되면 실패', () => {
        expect(() => createRouteInfoSchema.parse({ name: 'x', description: 'd' })).toThrow()
    })
})
