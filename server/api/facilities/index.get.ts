import { defineEventHandler } from 'h3'
import { sampleFacilities } from '#shared/data/sample-facilities'

export default defineEventHandler(() => {
    return sampleFacilities
})
