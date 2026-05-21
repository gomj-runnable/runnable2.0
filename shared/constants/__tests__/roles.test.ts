import { describe, it, expect } from 'vitest'
import { ROLES, getRoleName, ALL_ROLES } from '#shared/constants/roles'

describe('ROLES', () => {
    it('USER < SUPPORT < MODERATOR < QA < ANALYST < ADMIN < DEVELOPER 위계 유지', () => {
        expect(ROLES.USER).toBe(1)
        expect(ROLES.SUPPORT).toBe(10)
        expect(ROLES.MODERATOR).toBe(25)
        expect(ROLES.QA).toBe(35)
        expect(ROLES.ANALYST).toBe(40)
        expect(ROLES.ADMIN).toBe(50)
        expect(ROLES.DEVELOPER).toBe(99)

        expect(ROLES.USER).toBeLessThan(ROLES.SUPPORT)
        expect(ROLES.SUPPORT).toBeLessThan(ROLES.MODERATOR)
        expect(ROLES.MODERATOR).toBeLessThan(ROLES.QA)
        expect(ROLES.QA).toBeLessThan(ROLES.ANALYST)
        expect(ROLES.ANALYST).toBeLessThan(ROLES.ADMIN)
        expect(ROLES.ADMIN).toBeLessThan(ROLES.DEVELOPER)
    })
})

describe('getRoleName', () => {
    it('각 ROLES 코드에 대해 한글 이름을 반환한다', () => {
        expect(getRoleName(ROLES.USER)).toBe('사용자')
        expect(getRoleName(ROLES.SUPPORT)).toBe('지원')
        expect(getRoleName(ROLES.MODERATOR)).toBe('모더레이터')
        expect(getRoleName(ROLES.QA)).toBe('QA')
        expect(getRoleName(ROLES.ANALYST)).toBe('분석가')
        expect(getRoleName(ROLES.ADMIN)).toBe('관리자')
        expect(getRoleName(ROLES.DEVELOPER)).toBe('개발자')
    })

    it('알 수 없는 코드는 "알 수 없음" 을 반환한다', () => {
        expect(getRoleName(0)).toBe('알 수 없음')
        expect(getRoleName(999)).toBe('알 수 없음')
        expect(getRoleName(-1)).toBe('알 수 없음')
    })
})

describe('ALL_ROLES', () => {
    it('ROLES 값 7개를 모두 포함한다', () => {
        expect(ALL_ROLES).toHaveLength(7)
        expect(ALL_ROLES).toContain(ROLES.USER)
        expect(ALL_ROLES).toContain(ROLES.DEVELOPER)
    })
})
