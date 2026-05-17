import { createRunRecordSchema } from '#shared/schemas/run-record.schema'
import { getRunRecordRepository } from '../../repositories'
import { withAuth } from '../../utils/withAuth'
import { withExceptionHandler } from '../../utils/error'

export default defineEventHandler(
    withExceptionHandler(
        withAuth(async (event, user) => {
            const body = await readBody(event)
            const input = createRunRecordSchema.parse(body)
            const repo = await getRunRecordRepository()
            return repo.create(input, user.userId)
        })
    )
)
