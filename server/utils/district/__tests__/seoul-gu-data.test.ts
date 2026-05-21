import { describe, it, expect } from 'vitest'
import { SEOUL_GU_DATA, GU_BY_CODE, GU_BY_NAME } from '../seoul-gu-data'

describe('SEOUL_GU_DATA', () => {
    it('서울 25개 구를 포함', () => {
        expect(SEOUL_GU_DATA).toHaveLength(25)
    })

    it('모든 항목은 name/code/lng/lat/nx/ny 필드를 가진다', () => {
        for (const g of SEOUL_GU_DATA) {
            expect(typeof g.name).toBe('string')
            expect(g.code).toMatch(/^11\d{3}$/)
            expect(g.lng).toBeGreaterThan(126)
            expect(g.lng).toBeLessThan(128)
            expect(g.lat).toBeGreaterThan(37)
            expect(g.lat).toBeLessThan(38)
            expect(Number.isInteger(g.nx)).toBe(true)
            expect(Number.isInteger(g.ny)).toBe(true)
        }
    })

    it('code 중복 없음', () => {
        const codes = SEOUL_GU_DATA.map((g) => g.code)
        expect(new Set(codes).size).toBe(codes.length)
    })

    it('name 중복 없음', () => {
        const names = SEOUL_GU_DATA.map((g) => g.name)
        expect(new Set(names).size).toBe(names.length)
    })
})

describe('GU_BY_CODE / GU_BY_NAME 인덱스', () => {
    it('GU_BY_CODE 로 강남구 조회', () => {
        const gu = GU_BY_CODE.get('11680')
        expect(gu?.name).toBe('강남구')
    })

    it('GU_BY_NAME 으로 송파구 조회', () => {
        const gu = GU_BY_NAME.get('송파구')
        expect(gu?.code).toBe('11710')
    })

    it('미존재 코드는 undefined', () => {
        expect(GU_BY_CODE.get('99999')).toBeUndefined()
    })
})
