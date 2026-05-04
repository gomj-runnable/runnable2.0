import type { FacilityType } from '#shared/types/facility'
import type { IFacilityRepository } from './facility.repository'
import { getAllFacilities } from '../data/facilities'
import { haversineDistance } from '../utils/haversine'

export const facilityRepository: IFacilityRepository = {
    async findNearby(lat, lng, radius, types) {
        const latDelta = radius / 111_320
        const lngDelta = radius / (111_320 * Math.cos((lat * Math.PI) / 180))

        const facilities = await getAllFacilities()
        return facilities.filter((f) => {
            if (!types.includes(f.type as FacilityType)) return false
            if (Math.abs(f.lat - lat) > latDelta || Math.abs(f.lng - lng) > lngDelta) return false
            return haversineDistance(lat, lng, f.lat, f.lng) <= radius
        })
    },

    async findAll() {
        return getAllFacilities()
    }
}
