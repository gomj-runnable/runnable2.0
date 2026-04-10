export interface AuthUser {
    id: string
    name: string
    email: string
    image?: string | null
}

export const useAuthStore = () => {
    const user = useState<AuthUser | null>('auth-user', () => null)
    const isLoggedIn = computed(() => !!user.value)
    const isAuthModalOpen = useState('auth-modal-open', () => false)
    const authModalMode = useState<'login' | 'signup'>('auth-modal-mode', () => 'login')

    const openLoginModal = () => {
        authModalMode.value = 'login'
        isAuthModalOpen.value = true
    }

    const openSignupModal = () => {
        authModalMode.value = 'signup'
        isAuthModalOpen.value = true
    }

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
