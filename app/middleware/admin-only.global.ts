import { useAuthStore } from '../entities/user/model/useAuthStore'
import { hasAdminAccess } from '../../shared/constants/roles'
import { defineNuxtRouteMiddleware, navigateTo } from '#imports'

/**
 * Root /admin 전 영역에 대한 ADMIN(>=50) 게이트.
 * 위계 포함 정책에 따라 DEVELOPER(99)도 자동 통과.
 * layer 측 developer-only 미들웨어는 /admin/diagrams 경로만 추가로 게이트한다.
 */
export default defineNuxtRouteMiddleware((to) => {
    if (!to.path.startsWith('/admin')) return

    // 서버 사이드에서는 useState가 초기화되지 않으므로 클라이언트에서만 검사
    if (!import.meta.client) return

    const { user } = useAuthStore()
    if (!hasAdminAccess(user.value?.role)) {
        return navigateTo('/')
    }
})
