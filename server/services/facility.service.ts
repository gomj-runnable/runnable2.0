import { facilityRepository } from '../repositories'
import type { Facility, FacilityType } from '#shared/types/facility'

export const facilityService = {
    async findAll(): Promise<Facility[]> {
        return facilityRepository.findAll()
    },

    async findNearby(
        lat: number,
        lng: number,
        radius: number,
        types: FacilityType[]
    ): Promise<Facility[]> {
        return facilityRepository.findNearby(lat, lng, radius, types)
    }
}
