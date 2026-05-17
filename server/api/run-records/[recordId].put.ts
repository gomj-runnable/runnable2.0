import { z } from 'zod'
import { conditionLevelSchema } from '#shared/schemas/run-record.schema'
import { getRunRecordRepository } from '../../repositories'
import { withAuth } from '../../utils/withAuth'
import { withExceptionHandler } from '../../utils/error'

const updateSchema = z.object({
    rpe: z.number().int().min(1).max(10).optional(),
    condition: conditionLevelSchema.optional(),
    sleepHours: z.number().min(0).max(24).optional(),
    stressLevel: z.number().int().min(1).max(5).optional(),
    painAreas: z.array(z.string().max(50)).max(10).optional(),
    notes: z.string().max(1000).optional()
})

export default defineEventHandler(
    withExceptionHandler(
        withAuth(async (event, user) => {
            const recordId = getRouterParam(event, 'recordId')
            if (!recordId) {
                throw createError({ statusCode: 400, statusMessage: 'recordId is required' })
            }

            const repo = await getRunRecordRepository()
            const existing = await repo.getById(recordId)
            if (!existing) {
                throw createError({ statusCode: 404, statusMessage: 'Record not found' })
            }
            if (existing.userId !== user.userId) {
                throw createError({
                    statusCode: 403,
                    statusMessage: '본인의 기록만 수정할 수 있습니다.'
                })
            }

            const body = await readBody(event)
            const input = updateSchema.parse(body)
            return repo.update(recordId, input)
        })
    )
)
