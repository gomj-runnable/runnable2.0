// 시설물 Repository 어댑터 인터페이스 정의
import type { Facility, FacilityType } from '#shared/types/facility'

export interface IFacilityRepository {
    findNearby(lat: number, lng: number, radius: number, types: FacilityType[]): Promise<Facility[]>
    findAll(): Promise<Facility[]>
}
