import { describe, it, expect } from 'vitest'
import { useAuthStore } from '../useAuthStore'

describe('useAuthStore', () => {
    it('초기값: user=null, isLoggedIn=false', () => {
        const s = useAuthStore()
        expect(s.user.value).toBeNull()
        expect(s.isLoggedIn.value).toBe(false)
        expect(s.isAuthModalOpen.value).toBe(false)
    })

    it('openLoginModal / closeAuthModal', () => {
        const s = useAuthStore()
        s.openLoginModal()
        expect(s.isAuthModalOpen.value).toBe(true)

        s.closeAuthModal()
        expect(s.isAuthModalOpen.value).toBe(false)
    })

    it('user 가 채워지면 isLoggedIn=true', () => {
        const s = useAuthStore()
        s.user.value = { id: 'u-1', name: 'me', email: 'a@b.com' }
        expect(s.isLoggedIn.value).toBe(true)
    })
})
