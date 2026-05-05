import { useAuthStore } from '~/entities/user/model/useAuthStore'
import { useAuthSideeffect } from '~/entities/user/api/useAuthSideeffect'

export function useAuthFacade() {
    const authStore = useAuthStore()
    const authEffect = useAuthSideeffect()

    return { authStore, authEffect }
}
