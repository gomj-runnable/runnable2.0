import { defineEventHandler } from 'h3'
import { getFacilityRepository } from '../../repositories'

export default defineEventHandler(async () => {
    return (await getFacilityRepository()).findAll()
})
