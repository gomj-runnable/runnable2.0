import { useAuthStore } from '~/entities/user/model/useAuthStore'
import { hasDeveloperAccess } from '../../shared/constants/roles'
import { defineNuxtRouteMiddleware, navigateTo, createError } from '#imports'

/**
 * /dev/uml 전용 게이트.
 * - production 빌드에서는 404
 * - 개발 환경이라도 DEVELOPER(99) 권한이 없으면 / 로 리다이렉트
 */
export default defineNuxtRouteMiddleware(() => {
    if (!import.meta.dev) {
        throw createError({ statusCode: 404, statusMessage: 'Not Found' })
    }
    if (!import.meta.client) return
    const { user } = useAuthStore()
    if (!hasDeveloperAccess(user.value?.role)) {
        return navigateTo('/')
    }
})
