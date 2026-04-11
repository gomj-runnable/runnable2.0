import { z } from 'zod'
import { routeRepository } from '../../../repositories'
import { requireRouteOwnership } from '../../../utils/session'

const updateSchema = z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    isPublic: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
    const routeId = getRouterParam(event, 'routeId')
    if (!routeId) throw createError({ statusCode: 400, message: 'routeId is required' })

    await requireRouteOwnership(event, routeId)

    const body = await readBody(event)
    const input = updateSchema.parse(body)

    const updated = await routeRepository.updateRoute(routeId, input)
    return updated
})
