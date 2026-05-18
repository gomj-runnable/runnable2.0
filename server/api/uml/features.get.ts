import { defineEventHandler, createError } from 'h3'
import { getOrDetectFeatures } from '../../utils/uml/detect-features'
import { withExceptionHandler } from '../../utils/error'
import { withAdmin } from '../../utils/withAdmin'

export default defineEventHandler(
    withExceptionHandler(
        withAdmin(async () => {
            if (process.env.NODE_ENV === 'production') {
                throw createError({ statusCode: 404, statusMessage: 'Not Found' })
            }
            return await getOrDetectFeatures()
        })
    )
)
