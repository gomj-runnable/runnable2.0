import { describe, it, expect } from 'vitest'
import { ROLES } from '#shared/constants/roles'
import { Permission, hasPermission, can, ROLE_PERMISSIONS } from '#shared/constants/permissions'

describe('Permission enum', () => {
    it('9개 권한이 정의되어 있다', () => {
        const values = Object.values(Permission)
        expect(values).toHaveLength(9)
    })
})

describe('hasPermission()', () => {
    it('ADMIN은 VIEW_ADMIN_PAGE 접근 가능', () => {
        expect(hasPermission(ROLES.ADMIN, Permission.VIEW_ADMIN_PAGE)).toBe(true)
    })

    it('DEVELOPER는 VIEW_ADMIN_PAGE 접근 가능 (#205 — UML 페이지가 /admin 으로 이동)', () => {
        expect(hasPermission(ROLES.DEVELOPER, Permission.VIEW_ADMIN_PAGE)).toBe(true)
    })

    it('QA는 VIEW_DEV_PAGE 접근 가능 (#129/#130 결정)', () => {
        expect(hasPermission(ROLES.QA, Permission.VIEW_DEV_PAGE)).toBe(true)
    })

    it('DEVELOPER는 VIEW_DEV_PAGE 접근 가능', () => {
        expect(hasPermission(ROLES.DEVELOPER, Permission.VIEW_DEV_PAGE)).toBe(true)
    })

    it('ADMIN은 VIEW_DEV_PAGE 접근 불가', () => {
        expect(hasPermission(ROLES.ADMIN, Permission.VIEW_DEV_PAGE)).toBe(false)
    })

    it('USER는 어떤 권한도 없다', () => {
        for (const perm of Object.values(Permission)) {
            expect(hasPermission(ROLES.USER, perm)).toBe(false)
        }
    })

    it('MODERATOR는 MODERATE_PUBLIC_ROUTE 가능', () => {
        expect(hasPermission(ROLES.MODERATOR, Permission.MODERATE_PUBLIC_ROUTE)).toBe(true)
    })

    it('ANALYST는 VIEW_STATS_DASHBOARD 가능', () => {
        expect(hasPermission(ROLES.ANALYST, Permission.VIEW_STATS_DASHBOARD)).toBe(true)
    })

    it('null/undefined는 모든 권한 불가', () => {
        expect(hasPermission(null, Permission.VIEW_ADMIN_PAGE)).toBe(false)
        expect(hasPermission(undefined, Permission.VIEW_DEV_PAGE)).toBe(false)
    })

    it('ADMIN은 MANAGE_ROLES 가능, DEVELOPER는 불가', () => {
        expect(hasPermission(ROLES.ADMIN, Permission.MANAGE_ROLES)).toBe(true)
        expect(hasPermission(ROLES.DEVELOPER, Permission.MANAGE_ROLES)).toBe(false)
    })

    it('QA는 RESEED_DATABASE 가능', () => {
        expect(hasPermission(ROLES.QA, Permission.RESEED_DATABASE)).toBe(true)
    })

    it('SUPPORT는 READ_USER_DATA_ANON만 가능', () => {
        expect(hasPermission(ROLES.SUPPORT, Permission.READ_USER_DATA_ANON)).toBe(true)
        expect(hasPermission(ROLES.SUPPORT, Permission.READ_USER_DATA)).toBe(false)
    })
})

describe('can()', () => {
    it('hasPermission과 동일하게 동작한다', () => {
        expect(can(ROLES.ADMIN, Permission.VIEW_ADMIN_PAGE)).toBe(true)
        expect(can(ROLES.DEVELOPER, Permission.VIEW_ADMIN_PAGE)).toBe(true)
        expect(can(null, Permission.VIEW_ADMIN_PAGE)).toBe(false)
    })
})

describe('ROLE_PERMISSIONS 완전성', () => {
    it('모든 ROLES 값에 대해 매핑이 존재한다', () => {
        for (const role of Object.values(ROLES)) {
            expect(ROLE_PERMISSIONS[role]).toBeDefined()
        }
    })
})
