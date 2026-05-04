import type { Facility } from '#shared/types/facility'
import hospitalsData from './hospitals.json'
import toiletsData from './toilets.json'
import fountainsData from './fountains.json'
import lockersData from './lockers.json'
import crosswalksData from './crosswalks.json'

/** 서울시 공공데이터 기반 시설물 전체 목록 (서버 기동 시 한 번 로드) */
export const seoulFacilities: Facility[] = [
    ...(hospitalsData as Facility[]),
    ...(toiletsData as Facility[]),
    ...(fountainsData as Facility[]),
    ...(lockersData as Facility[]),
    ...(crosswalksData as Facility[])
]
