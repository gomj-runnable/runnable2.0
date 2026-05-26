import { getDb } from '../database/client'
import type { IRouteRepository } from './route.repository'
import type { IRouteInfoRepository } from './routeInfo.repository'
import type { IFacilityRepository } from './facility.repository'
import { DrizzleRouteRepository } from './route.repository.drizzle'
import { DrizzleRouteInfoRepository } from './routeInfo.repository.drizzle'
import { DrizzleFacilityRepository } from './facility.repository.drizzle'

let _routeRepo: IRouteRepository | null = null
let _routeInfoRepo: IRouteInfoRepository | null = null
let _facilityRepo: IFacilityRepository | null = null

export async function getRouteRepository(): Promise<IRouteRepository> {
    if (!_routeRepo) _routeRepo = new DrizzleRouteRepository(await getDb())
    return _routeRepo
}

export async function getRouteInfoRepository(): Promise<IRouteInfoRepository> {
    if (!_routeInfoRepo) _routeInfoRepo = new DrizzleRouteInfoRepository(await getDb())
    return _routeInfoRepo
}

export async function getFacilityRepository(): Promise<IFacilityRepository> {
    if (!_facilityRepo) _facilityRepo = new DrizzleFacilityRepository(await getDb())
    return _facilityRepo
}
