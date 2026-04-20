/** 앱 전역에서 사용하는 인증 사용자 정보 타입 */
export interface AuthUser {
    /** better-auth가 부여한 사용자 고유 ID */
    id: string
    /** 사용자 표시 이름 */
    name: string
    /** 사용자 이메일 주소 */
    email: string
    /** 프로필 이미지 URL. 없으면 `null`. */
    image?: string | null
}

/**
 * 인증 상태(로그인 사용자·모달 개폐)를 관리하는 store composable.
 * `useAuthSideeffect`가 인증 결과를 `user`에 반영하고, 이 store는 상태 노출만 담당한다.
 */
export const useAuthStore = () => {
    /** 현재 로그인된 사용자 정보. 미로그인이면 `null`. */
    const user = useState<AuthUser | null>('auth-user', () => null)
    /** 사용자가 로그인된 상태인지 여부 */
    const isLoggedIn = computed(() => !!user.value)
    /** 인증 모달(로그인/회원가입)의 열림 상태 */
    const isAuthModalOpen = useState('auth-modal-open', () => false)
    /** 인증 모달의 현재 표시 모드 (`'login'` | `'signup'`) */
    const authModalMode = useState<'login' | 'signup'>('auth-modal-mode', () => 'login')

    /** 로그인 모달을 연다. */
    const openLoginModal = () => {
        authModalMode.value = 'login'
        isAuthModalOpen.value = true
    }

    /** 회원가입 모달을 연다. */
    const openSignupModal = () => {
        authModalMode.value = 'signup'
        isAuthModalOpen.value = true
    }

    /** 인증 모달을 닫는다. */
    const closeAuthModal = () => {
        isAuthModalOpen.value = false
    }

    return {
        user,
        isLoggedIn,
        isAuthModalOpen,
        authModalMode,
        openLoginModal,
        openSignupModal,
        closeAuthModal
    }
}
