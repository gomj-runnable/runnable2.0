import { createAuthClient } from 'better-auth/vue'
import type { AuthUser } from '../store/useAuthStore'
import { useAuthStore } from '../store/useAuthStore'

let authClient: ReturnType<typeof createAuthClient> | null = null

const getClient = () => {
    if (!authClient) {
        authClient = createAuthClient({
            baseURL: window.location.origin
        })
    }
    return authClient
}

export const useAuthSideeffect = () => {
    const store = useAuthStore()

    const fetchSession = async () => {
        try {
            const { data } = await getClient().getSession()
            if (data?.user) {
                store.user.value = {
                    id: data.user.id,
                    name: data.user.name,
                    email: data.user.email,
                    image: data.user.image
                }
            }
        } catch {
            store.user.value = null
        }
    }

    const login = async (email: string, password: string) => {
        const { data, error } = await getClient().signIn.email({ email, password })
        if (error) throw new Error(error.message ?? '로그인에 실패했습니다.')
        if (data?.user) {
            store.user.value = {
                id: data.user.id,
                name: data.user.name,
                email: data.user.email,
                image: data.user.image
            } satisfies AuthUser
        }
        store.closeAuthModal()
    }

    const signup = async (name: string, email: string, password: string) => {
        const { data, error } = await getClient().signUp.email({ name, email, password })
        if (error) throw new Error(error.message ?? '회원가입에 실패했습니다.')
        if (data?.user) {
            store.user.value = {
                id: data.user.id,
                name: data.user.name,
                email: data.user.email,
                image: data.user.image
            } satisfies AuthUser
        }
        store.closeAuthModal()
    }

    const logout = async () => {
        await getClient().signOut()
        store.user.value = null
    }

    return { fetchSession, login, signup, logout }
}
