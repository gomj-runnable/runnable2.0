import { defineEventHandler } from 'h3'
import { facilityRepository } from '../../repositories'

export default defineEventHandler(async () => {
    return facilityRepository.findAll()
})
