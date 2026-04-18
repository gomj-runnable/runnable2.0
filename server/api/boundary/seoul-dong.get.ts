import { defineEventHandler } from 'h3'
import { getEmdBoundary } from '../../utils/district/boundary'

export default defineEventHandler(async () => {
    try {
        return await getEmdBoundary()
    } catch {
        return { type: 'FeatureCollection', features: [] }
    }
})
