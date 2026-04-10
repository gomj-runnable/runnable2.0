import { routeRepository } from '../../repositories/route.repository.drizzle'
import { getSessionUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
    const user = await getSessionUser(event)

    // 인증된 사용자: 내 경로 반환, 미인증: 공개 경로 반환
    if (user) {
        return routeRepository.listRoutesByUser(user.userId)
    }

    return routeRepository.searchPublicRoutes()
})
