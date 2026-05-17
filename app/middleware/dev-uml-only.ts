import { useAuthStore } from '~/entities/user/model/useAuthStore'
import { hasPermission, Permission } from '../../shared/constants/permissions'
import { defineNuxtRouteMiddleware, navigateTo, createError } from '#imports'

/**
 * /dev/uml 전용 게이트.
 * - production 빌드에서는 404
 * - 개발 환경에서 VIEW_DEV_PAGE 권한이 없으면 / 로 리다이렉트
 * - QA, DEVELOPER 가 진입 가능 (#129/#130 결정)
 */
export default defineNuxtRouteMiddleware(() => {
    if (!import.meta.dev) {
        throw createError({ statusCode: 404, statusMessage: 'Not Found' })
    }
    if (!import.meta.client) return
    const { user } = useAuthStore()
    if (!hasPermission(user.value?.role, Permission.VIEW_DEV_PAGE)) {
        return navigateTo('/')
    }
})
