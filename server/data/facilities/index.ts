import type { Facility } from '#shared/types/facility'
import hospitalsData from './hospitals.json'
import toiletsData from './toilets.json'
import fountainsData from './fountains.json'
import lockersData from './lockers.json'

/** 횡단보도 제외 기본 시설물 */
export const seoulFacilities: Facility[] = [
    ...(hospitalsData as Facility[]),
    ...(toiletsData as Facility[]),
    ...(fountainsData as Facility[]),
    ...(lockersData as Facility[])
]

/** 횡단보도 포함 전체 시설물 (9MB+ crosswalks.json을 lazy load) */
let _allFacilities: Facility[] | null = null
export async function getAllFacilities(): Promise<Facility[]> {
    if (!_allFacilities) {
        const crosswalksData = await import('./crosswalks.json').then((m) => m.default)
        _allFacilities = [...seoulFacilities, ...(crosswalksData as Facility[])]
    }
    return _allFacilities
}
