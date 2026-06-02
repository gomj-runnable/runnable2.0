import { auth } from '../security/auth/service'
import { hasPermission, Permission } from '#shared/constants/permissions'
import { getEnvMode, ENVIRONMENT_MODE } from '../config/envMode'

/**
 * /admin, /dev 페이지 경로에 대한 서버 측 권한 가드.
 * SPA(ssr: false) 환경에서 클라이언트 미들웨어만으로는
 * HTML 셸이 먼저 전달되므로 서버에서 사전 차단한다.
 * API 경로(/api/)는 각 핸들러가 자체 인증하므로 제외.
 */
export default defineEventHandler(async (event) => {
    const path = getRequestURL(event).pathname

    // API 요청은 각 핸들러가 처리
    if (path.startsWith('/api/')) return

    const isAdminPage = path.startsWith('/admin')
    const isDevPage = path.startsWith('/dev')
    if (!isAdminPage && !isDevPage) return

    // /dev 경로는 production 빌드에서 완전 차단
    if (isDevPage && getEnvMode() === ENVIRONMENT_MODE.PRODUCT) {
        throw createError({ statusCode: 404, statusMessage: 'Not Found' })
    }

    const session = await auth.getSession(event)
    if (!session) {
        throw createError({ statusCode: 403, message: '접근 권한이 없습니다.' })
    }

    if (isAdminPage && !hasPermission(session.role, Permission.VIEW_ADMIN_PAGE)) {
        throw createError({ statusCode: 403, message: '관리자 권한이 필요합니다.' })
    }

    if (isDevPage && !hasPermission(session.role, Permission.VIEW_DEV_PAGE)) {
        throw createError({ statusCode: 403, message: '개발자 권한이 필요합니다.' })
    }
})
