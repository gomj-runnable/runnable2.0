import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

import { useAuthSideeffect } from '~/entities/user/api/useAuthSideeffect'

const authClient = vi.hoisted(() => {
    const getSession = vi.fn()
    const signInEmail = vi.fn()
    const signUpEmail = vi.fn()
    const signOut = vi.fn()
    const createAuthClient = vi.fn(() => ({
        getSession,
        signIn: { email: signInEmail },
        signUp: { email: signUpEmail },
        signOut
    }))
    return { createAuthClient, getSession, signInEmail, signUpEmail, signOut }
})

vi.mock('better-auth/vue', () => ({
    createAuthClient: authClient.createAuthClient
}))

// useAuthStore 의 user 를 sideeffect 와 테스트가 공유하도록 hoisted singleton 으로 mock.
const sharedStore = vi.hoisted(() => ({
    user: { value: null as any },
    isLoggedIn: { value: false },
    isAuthModalOpen: { value: false },
    authModalMode: { value: 'login' as 'login' | 'signup' },
    openLoginModal: vi.fn(),
    openSignupModal: vi.fn(),
    closeAuthModal: vi.fn(function () {
        sharedStore.isAuthModalOpen.value = false
    })
}))
vi.mock('~/entities/user/model/useAuthStore', () => ({
    useAuthStore: () => sharedStore
}))

// window.location.origin 필요
vi.stubGlobal('window', { location: { origin: 'http://localhost' } } as any)

const user = (overrides: Record<string, unknown> = {}) => ({
    id: 'u1',
    name: 'tester',
    email: 't@example.com',
    image: null,
    role: 1,
    ...overrides
})

describe('useAuthSideeffect', () => {
    beforeEach(() => {
        authClient.getSession.mockReset()
        authClient.signInEmail.mockReset()
        authClient.signUpEmail.mockReset()
        authClient.signOut.mockReset()
        sharedStore.user.value = null
        sharedStore.isAuthModalOpen.value = false
        sharedStore.closeAuthModal.mockClear()
    })

    describe('fetchSession', () => {
        it('세션이 있으면 store.user 갱신', async () => {
            authClient.getSession.mockResolvedValue({ data: { user: user() } })
            const sideeffect = useAuthSideeffect()
            const store = sharedStore
            await sideeffect.fetchSession()
            expect(store.user.value?.id).toBe('u1')
        })

        it('세션이 없으면 user.value = null', async () => {
            authClient.getSession.mockResolvedValue({ data: null })
            const sideeffect = useAuthSideeffect()
            const store = sharedStore
            store.user.value = user() as any
            await sideeffect.fetchSession()
            expect(store.user.value).toBeNull()
        })

        it('예외 발생 시 기존 store.user 유지', async () => {
            authClient.getSession.mockRejectedValue(new Error('network'))
            const sideeffect = useAuthSideeffect()
            const store = sharedStore
            const existing = user({ id: 'kept' }) as any
            store.user.value = existing
            await sideeffect.fetchSession()
            expect(store.user.value).toBe(existing)
        })
    })

    describe('login', () => {
        it('성공 — store.user 갱신 + closeAuthModal', async () => {
            authClient.signInEmail.mockResolvedValue({ data: { user: user() }, error: null })
            authClient.getSession.mockResolvedValue({ data: { user: user() } })

            const sideeffect = useAuthSideeffect()
            const store = sharedStore
            store.isAuthModalOpen.value = true

            await sideeffect.login('t@example.com', 'pw')
            expect(store.user.value?.id).toBe('u1')
            expect(store.isAuthModalOpen.value).toBe(false)
        })

        it('error 가 있으면 throw + 메시지 전달', async () => {
            authClient.signInEmail.mockResolvedValue({
                data: null,
                error: { message: '잘못된 비밀번호' }
            })
            const sideeffect = useAuthSideeffect()
            await expect(sideeffect.login('t@e.com', 'pw')).rejects.toThrow('잘못된 비밀번호')
        })

        it('error.message 누락 시 기본 메시지', async () => {
            authClient.signInEmail.mockResolvedValue({ data: null, error: {} })
            const sideeffect = useAuthSideeffect()
            await expect(sideeffect.login('t@e.com', 'pw')).rejects.toThrow('로그인')
        })
    })

    describe('signup', () => {
        it('성공 — store.user 갱신 + closeAuthModal', async () => {
            authClient.signUpEmail.mockResolvedValue({ data: { user: user() }, error: null })
            authClient.getSession.mockResolvedValue({ data: { user: user() } })

            const sideeffect = useAuthSideeffect()
            const store = sharedStore
            store.isAuthModalOpen.value = true

            await sideeffect.signup('name', 't@e.com', 'pw')
            expect(store.user.value?.id).toBe('u1')
            expect(store.isAuthModalOpen.value).toBe(false)
        })

        it('error 있으면 throw + 회원가입 메시지', async () => {
            authClient.signUpEmail.mockResolvedValue({
                data: null,
                error: { message: '이메일 중복' }
            })
            const sideeffect = useAuthSideeffect()
            await expect(sideeffect.signup('n', 'e', 'p')).rejects.toThrow('이메일 중복')
        })
    })

    describe('logout', () => {
        it('signOut 호출 + store.user 초기화', async () => {
            authClient.signOut.mockResolvedValue({})
            const sideeffect = useAuthSideeffect()
            const store = sharedStore
            store.user.value = user() as any

            await sideeffect.logout()
            expect(authClient.signOut).toHaveBeenCalled()
            expect(store.user.value).toBeNull()
        })
    })
})
