import { defineEventHandler, readBody, createError } from 'h3'
import { analyzeRequestSchema } from '#shared/schemas/uml.schema'
import { findFeatures, getOrDetectFeatures } from '../../utils/uml/detect-features'
import { analyzeFeatures } from '../../utils/uml/analyzers'
import { badRequest } from '../../utils/error'

export default defineEventHandler(async (event) => {
    if (process.env.NODE_ENV === 'production') {
        throw createError({ statusCode: 404, statusMessage: 'Not Found' })
    }

    const body = await readBody(event)
    const parsed = analyzeRequestSchema.safeParse(body)
    if (!parsed.success) {
        throw badRequest(
            parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
        )
    }
    const { domain, featureIds, diagramType } = parsed.data

    const payload = await getOrDetectFeatures()
    const features = findFeatures(payload, domain, featureIds)
    if (features.length === 0) {
        throw badRequest(`해당 도메인(${domain})에서 매칭되는 Feature 가 없습니다.`)
    }
    return await analyzeFeatures(features, diagramType)
})
