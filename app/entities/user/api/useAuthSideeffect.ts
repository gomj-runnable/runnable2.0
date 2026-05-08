import { createAuthClient } from 'better-auth/vue'
import type { AuthUser } from '../model/useAuthStore'
import { useAuthStore } from '../model/useAuthStore'

/** better-auth 응답의 user 객체를 AuthUser로 변환한다. role 필드는 schema 확장으로 추가된 정수. */
const toAuthUser = (user: {
    id: string
    name: string
    email: string
    image?: string | null
    role?: number | null
}): AuthUser => ({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role
})

/** better-auth 클라이언트 싱글톤. 최초 호출 시 생성되고 이후 재사용된다. */
let authClient: ReturnType<typeof createAuthClient> | null = null

/** better-auth 클라이언트를 싱글톤으로 반환한다. */
const getClient = () => {
    if (!authClient) {
        authClient = createAuthClient({
            baseURL: window.location.origin
        })
    }
    return authClient
}

/**
 * better-auth를 통해 로그인·회원가입·로그아웃·세션 조회를 처리하는 sideeffect composable.
 * 인증 결과는 `useAuthStore`의 `user` ref에 반영한다.
 */
export const useAuthSideeffect = () => {
    const store = useAuthStore()

    /**
     * 현재 세션을 서버에서 조회하여 `store.user`를 갱신한다.
     * 세션이 없으면 `store.user`를 `null`로 초기화한다.
     * 오류 시에는 기존 값을 유지한다 (1차 로그인 데이터 보호).
     */
    const fetchSession = async () => {
        try {
            const { data } = await getClient().getSession()
            if (data?.user) {
                store.user.value = toAuthUser(data.user)
            } else {
                store.user.value = null
            }
        } catch {
            // 네트워크 오류 등 예외 시 기존 store 값을 유지한다
        }
    }

    /**
     * 이메일·비밀번호로 로그인한다.
     * signIn 응답에 role 이 누락될 수 있으므로 fetchSession 으로 role 을 보강한다.
     * 성공 시 인증 모달을 닫는다. 실패 시 예외를 던진다.
     *
     * @param email - 사용자 이메일
     * @param password - 사용자 비밀번호
     */
    const login = async (email: string, password: string) => {
        const { data, error } = await getClient().signIn.email({ email, password })
        if (error) throw new Error(error.message ?? '로그인에 실패했습니다.')
        if (data?.user) {
            store.user.value = toAuthUser(data.user)
        }
        await fetchSession()
        store.closeAuthModal()
    }

    /**
     * 이름·이메일·비밀번호로 회원가입한다.
     * signUp 후 better-auth 가 자동 로그인 세션을 발급하므로 fetchSession 으로 role 을 보강한다.
     * 성공 시 인증 모달을 닫는다. 실패 시 예외를 던진다.
     *
     * @param name - 사용자 이름
     * @param email - 사용자 이메일
     * @param password - 사용자 비밀번호
     */
    const signup = async (name: string, email: string, password: string) => {
        const { data, error } = await getClient().signUp.email({ name, email, password })
        if (error) throw new Error(error.message ?? '회원가입에 실패했습니다.')
        if (data?.user) {
            store.user.value = toAuthUser(data.user)
        }
        await fetchSession()
        store.closeAuthModal()
    }

    /**
     * 현재 세션을 종료하고 `store.user`를 `null`로 초기화한다.
     */
    const logout = async () => {
        await getClient().signOut()
        store.user.value = null
    }

    return { fetchSession, login, signup, logout }
}
