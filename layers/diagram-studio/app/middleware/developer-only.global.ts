import { isDeveloper } from '../../runtime/auth-gate'
import { defineNuxtRouteMiddleware, navigateTo } from '#imports'

export default defineNuxtRouteMiddleware(async (to) => {
    if (!to.path.startsWith('/admin/diagrams')) return

    // import.meta.client: 서버 사이드에서는 gate가 등록되지 않으므로 클라이언트에서만 검사
    if (!import.meta.client) return

    const allowed = await isDeveloper()
    if (!allowed) {
        return navigateTo('/')
    }
})
