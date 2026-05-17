import { getCurationRepository } from '../../../repositories'

export default defineEventHandler(async (event) => {
    const collectionId = getRouterParam(event, 'collectionId')
    if (!collectionId) {
        throw createError({ statusCode: 400, statusMessage: 'collectionId is required' })
    }

    const repo = await getCurationRepository()
    const collection = await repo.getCollection(collectionId)
    if (!collection) {
        throw createError({ statusCode: 404, statusMessage: 'Collection not found' })
    }
    return collection
})
