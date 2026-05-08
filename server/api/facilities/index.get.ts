import { defineEventHandler } from 'h3'
import { facilityService } from '../../services/facility.service'

export default defineEventHandler(async () => {
    return facilityService.findAll()
})
