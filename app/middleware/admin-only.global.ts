import { useAuthStore } from '../entities/user/model/useAuthStore'
import { hasPermission, Permission } from '../../shared/constants/permissions'
import { defineNuxtRouteMiddleware, navigateTo } from '#imports'

/**
 * /admin 전 영역에 대한 권한 게이트.
 * VIEW_ADMIN_PAGE 권한이 있는 역할(ADMIN, DEVELOPER)만 통과 (#129/#130 결정).
 */
export default defineNuxtRouteMiddleware((to) => {
    if (!to.path.startsWith('/admin')) return

    // 서버 사이드에서는 useState가 초기화되지 않으므로 클라이언트에서만 검사
    if (!import.meta.client) return

    const { user } = useAuthStore()
    if (!hasPermission(user.value?.role, Permission.VIEW_ADMIN_PAGE)) {
        return navigateTo('/')
    }
})
