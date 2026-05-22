import { describe, it, expect, beforeEach } from 'vitest'
import { defineDeveloperGate, defineAdminGate, isDeveloper, isAdmin } from '../auth-gate'

describe('auth-gate', () => {
    beforeEach(() => {
        defineDeveloperGate(null as any)
        defineAdminGate(null as any)
    })

    it('gate 미등록 시 false', async () => {
        await expect(isDeveloper()).resolves.toBe(false)
        await expect(isAdmin()).resolves.toBe(false)
    })

    it('동기 gate 등록 결과 반영', async () => {
        defineDeveloperGate(() => true)
        defineAdminGate(() => false)

        await expect(isDeveloper()).resolves.toBe(true)
        await expect(isAdmin()).resolves.toBe(false)
    })

    it('비동기 gate 도 await 처리', async () => {
        defineDeveloperGate(async () => true)
        defineAdminGate(async () => true)

        await expect(isDeveloper()).resolves.toBe(true)
        await expect(isAdmin()).resolves.toBe(true)
    })

    it('truthy/falsy 값은 boolean 으로 normalize', async () => {
        defineDeveloperGate(() => 1 as any)
        defineAdminGate(() => 0 as any)

        await expect(isDeveloper()).resolves.toBe(true)
        await expect(isAdmin()).resolves.toBe(false)
    })
})
