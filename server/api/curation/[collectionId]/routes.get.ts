import { getCurationRepository } from '../../../repositories'

export default defineEventHandler(async (event) => {
    const collectionId = getRouterParam(event, 'collectionId')
    if (!collectionId) {
        throw createError({ statusCode: 400, statusMessage: 'collectionId is required' })
    }

    const repo = await getCurationRepository()
    return repo.listRoutes(collectionId)
})
