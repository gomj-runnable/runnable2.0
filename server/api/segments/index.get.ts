import { getSegmentRepository } from '../../repositories'
import { getSessionUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const repo = await getSegmentRepository()

    if (query.routeId) {
        return repo.listSegmentsByRoute(query.routeId as string)
    }

    const user = await getSessionUser(event)
    if (query.mine && user) {
        return repo.listSegmentsByOwner(user.userId)
    }

    return repo.listPublicSegments()
})
