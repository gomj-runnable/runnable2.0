// 각 Repository 싱글턴을 초기화하고 반환하는 팩토리 함수 모음
import { getDb } from '../database/client'
import { DrizzleRouteRepository, type IRouteRepository } from './route.repository'
import { DrizzleRouteInfoRepository, type IRouteInfoRepository } from './routeInfo.repository'
import { DrizzleFacilityRepository, type IFacilityRepository } from './facility.repository'
import {
    DrizzleUserFeaturePrefRepository,
    type IUserFeaturePrefRepository
} from './userFeaturePref.repository'

let _routeRepo: IRouteRepository | null = null
let _routeInfoRepo: IRouteInfoRepository | null = null
let _facilityRepo: IFacilityRepository | null = null
let _userFeaturePrefRepo: IUserFeaturePrefRepository | null = null

// 경로 Repository 싱글턴 반환
export async function getRouteRepository(): Promise<IRouteRepository> {
    if (!_routeRepo) _routeRepo = new DrizzleRouteRepository(await getDb())
    return _routeRepo
}

// 경로정보 Repository 싱글턴 반환
export async function getRouteInfoRepository(): Promise<IRouteInfoRepository> {
    if (!_routeInfoRepo) _routeInfoRepo = new DrizzleRouteInfoRepository(await getDb())
    return _routeInfoRepo
}

// 시설물 Repository 싱글턴 반환
export async function getFacilityRepository(): Promise<IFacilityRepository> {
    if (!_facilityRepo) _facilityRepo = new DrizzleFacilityRepository(await getDb())
    return _facilityRepo
}

// 사용자 플러그인 선호 Repository 싱글턴 반환
export async function getUserFeaturePrefRepository(): Promise<IUserFeaturePrefRepository> {
    if (!_userFeaturePrefRepo)
        _userFeaturePrefRepo = new DrizzleUserFeaturePrefRepository(await getDb())
    return _userFeaturePrefRepo
}
