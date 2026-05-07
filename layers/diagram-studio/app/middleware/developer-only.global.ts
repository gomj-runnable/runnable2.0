import { useAuthStore } from '~/entities/user/model/useAuthStore'
import { hasDeveloperAccess } from '../../../../shared/constants/roles'
import { defineNuxtRouteMiddleware, navigateTo } from '#imports'

export default defineNuxtRouteMiddleware((to) => {
    // layer 자립 원칙: 자기 경로(/admin/diagrams)만 책임. host 측 admin-only 미들웨어가 root /admin 게이트를 담당.
    if (!to.path.startsWith('/admin/diagrams')) return

    // 서버 사이드에서는 useState가 초기화되지 않으므로 클라이언트에서만 검사
    if (!import.meta.client) return

    const { user } = useAuthStore()
    if (!hasDeveloperAccess(user.value?.role)) {
        return navigateTo('/')
    }
})
