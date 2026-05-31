import { useAuthStore } from '~/entities/user/model/useAuthStore'
import { useAuthSideeffect } from '~/entities/user/api/useAuthSideeffect'

/** 인증 스토어와 인증 사이드이펙트를 묶어 반환하는 sub-facade. */
export function useAuthFacade() {
    const authStore = useAuthStore()
    const authEffect = useAuthSideeffect()

    return { authStore, authEffect }
}
