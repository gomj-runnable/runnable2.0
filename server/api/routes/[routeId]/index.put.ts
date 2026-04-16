import { z } from 'zod'
import { routeRepository } from '../../../repositories'
import { requireRouteOwnership } from '../../../utils/session'
import { requireRouteIdParam } from '../../../utils/params'

const updateSchema = z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    isPublic: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
    const routeId = requireRouteIdParam(event)

    await requireRouteOwnership(event, routeId)

    const body = await readBody(event)
    const input = updateSchema.parse(body)

    const updated = await routeRepository.updateRoute(routeId, input)
    return updated
})
