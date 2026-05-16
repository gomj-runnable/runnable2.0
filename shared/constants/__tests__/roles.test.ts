import { describe, it, expect } from 'vitest'
import { ROLES, hasAdminAccess, hasDeveloperAccess } from '#shared/constants/roles'

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

describe('hasAdminAccess()', () => {
    it('USER는 admin 접근 불가', () => {
        expect(hasAdminAccess(ROLES.USER)).toBe(false)
    })

    it('SUPPORT/QA/MODERATOR/ANALYST는 admin 접근 불가 (#128 신규 역할은 매트릭스 결정 전까지 admin이 아님)', () => {
        expect(hasAdminAccess(ROLES.SUPPORT)).toBe(false)
        expect(hasAdminAccess(ROLES.QA)).toBe(false)
        expect(hasAdminAccess(ROLES.MODERATOR)).toBe(false)
        expect(hasAdminAccess(ROLES.ANALYST)).toBe(false)
    })

    it('ADMIN/DEVELOPER는 admin 접근 가능', () => {
        expect(hasAdminAccess(ROLES.ADMIN)).toBe(true)
        expect(hasAdminAccess(ROLES.DEVELOPER)).toBe(true)
    })

    it('null/undefined는 admin 접근 불가', () => {
        expect(hasAdminAccess(null)).toBe(false)
        expect(hasAdminAccess(undefined)).toBe(false)
    })
})

describe('hasDeveloperAccess()', () => {
    it('DEVELOPER만 developer 접근 가능', () => {
        expect(hasDeveloperAccess(ROLES.DEVELOPER)).toBe(true)
    })

    it('USER/SUPPORT/QA/MODERATOR/ANALYST/ADMIN은 developer 접근 불가', () => {
        expect(hasDeveloperAccess(ROLES.USER)).toBe(false)
        expect(hasDeveloperAccess(ROLES.SUPPORT)).toBe(false)
        expect(hasDeveloperAccess(ROLES.QA)).toBe(false)
        expect(hasDeveloperAccess(ROLES.MODERATOR)).toBe(false)
        expect(hasDeveloperAccess(ROLES.ANALYST)).toBe(false)
        expect(hasDeveloperAccess(ROLES.ADMIN)).toBe(false)
    })

    it('null/undefined는 developer 접근 불가', () => {
        expect(hasDeveloperAccess(null)).toBe(false)
        expect(hasDeveloperAccess(undefined)).toBe(false)
    })
})
