import { describe, it, expect } from 'vitest'
import { ROLES } from '#shared/constants/roles'

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
