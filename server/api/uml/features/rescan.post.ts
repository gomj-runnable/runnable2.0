import { defineEventHandler, createError } from 'h3'
import { rescanFeatures } from '../../../utils/uml/detect-features'

export default defineEventHandler(async () => {
    if (process.env.NODE_ENV === 'production') {
        throw createError({ statusCode: 404, statusMessage: 'Not Found' })
    }
    return await rescanFeatures()
})
