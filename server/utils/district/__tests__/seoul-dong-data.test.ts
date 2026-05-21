import { describe, it, expect } from 'vitest'
import { SEOUL_DONG_MAP } from '../seoul-dong-data'

describe('SEOUL_DONG_MAP', () => {
    it('서울 25개 구를 키로 가진다', () => {
        expect(Object.keys(SEOUL_DONG_MAP)).toHaveLength(25)
    })

    it('모든 값은 비어있지 않은 문자열 배열', () => {
        for (const [gu, dongs] of Object.entries(SEOUL_DONG_MAP)) {
            expect(Array.isArray(dongs)).toBe(true)
            expect(dongs.length).toBeGreaterThan(0)
            for (const dong of dongs) {
                expect(typeof dong).toBe('string')
                expect(dong.length).toBeGreaterThan(0)
            }
            expect(gu.length).toBeGreaterThan(0)
        }
    })

    it('강남구는 대치동/역삼동을 포함', () => {
        const gangnam = SEOUL_DONG_MAP['강남구']
        expect(gangnam).toContain('대치동')
        expect(gangnam).toContain('역삼동')
    })
})
