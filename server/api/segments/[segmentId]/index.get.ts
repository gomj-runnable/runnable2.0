import { getSegmentRepository } from '../../../repositories'

export default defineEventHandler(async (event) => {
    const segmentId = getRouterParam(event, 'segmentId')
    if (!segmentId) {
        throw createError({ statusCode: 400, statusMessage: 'segmentId is required' })
    }

    const repo = await getSegmentRepository()
    const segment = await repo.getSegment(segmentId)
    if (!segment) {
        throw createError({ statusCode: 404, statusMessage: 'Segment not found' })
    }
    return segment
})
