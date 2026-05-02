import { defineEventHandler } from 'h3'
import { seoulFacilities } from '../../data/facilities'

export default defineEventHandler(() => {
    return seoulFacilities
})
