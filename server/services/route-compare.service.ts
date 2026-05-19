/**
 * 경로 비교 지표 계산 (#189).
 *
 * `routeId` 기반으로 sections 을 읽어 거리·누적 상승/하강·예상 시간·시설물 카운트를 한꺼번에 집계한다.
 * 거리/고도/시간 계산은 순수 함수로 분리해 단위 테스트를 부여한다.
 */

import { length as turfLength, lineString as turfLineString } from '@turf/turf'
import { getRouteRepository, getFacilityRepository } from '../repositories'
import type { Position } from 'geojson'
import type { FacilityType } from '#shared/types/facility'
import type { RouteCompareMeta } from '#shared/types/route-compare'

/** 기본 러닝 페이스 (분/km). 사용자별 페이스가 정해지기 전 기본값으로 사용. */
const DEFAULT_PACE_MIN_PER_KM = 6

/** 시설물 검색 반경 (m). 경로 좌표 1개당 nearby 조회 시 사용. */
const FACILITY_BUFFER_METERS = 50

/** 시설물 카운트 시 샘플링 간격 — 좌표 1개당 한 번씩 조회하면 너무 무거우니 일정 간격마다 샘플. */
const FACILITY_SAMPLE_STRIDE = 10

const FACILITY_TYPES: FacilityType[] = [
    'sidewalk',
    'crosswalk',
    'fountain',
    'locker',
    'hospital',
    'toilet'
]

/**
 * GeoJSON LineString 좌표 배열의 총 거리 (km).
 * 좌표는 [lng, lat, z?] 형식.
 */
export function computeDistanceKm(coords: Position[]): number {
    if (coords.length < 2) return 0
    return turfLength(turfLineString(coords), { units: 'kilometers' })
}

/**
 * 누적 상승고도 (m). z 가 없는 좌표는 0 으로 간주.
 */
export function computeAscentM(coords: Position[]): number {
    let ascent = 0
    for (let i = 1; i < coords.length; i++) {
        const prev = coords[i - 1]?.[2] ?? 0
        const curr = coords[i]?.[2] ?? 0
        const diff = curr - prev
        if (diff > 0) ascent += diff
    }
    return ascent
}

/**
 * 누적 하강고도 (m, 양수 반환).
 */
export function computeDescentM(coords: Position[]): number {
    let descent = 0
    for (let i = 1; i < coords.length; i++) {
        const prev = coords[i - 1]?.[2] ?? 0
        const curr = coords[i]?.[2] ?? 0
        const diff = curr - prev
        if (diff < 0) descent += -diff
    }
    return descent
}

/**
 * 예상 소요시간 (분). 사용자 페이스 미지정 시 DEFAULT_PACE_MIN_PER_KM 사용.
 */
export function estimateDurationMin(
    distanceKm: number,
    paceMinPerKm: number = DEFAULT_PACE_MIN_PER_KM
): number {
    return distanceKm * paceMinPerKm
}

/**
 * 좌표 배열을 STRIDE 간격으로 샘플링한다.
 * 첫·마지막 좌표는 반드시 포함.
 */
export function sampleCoords(coords: Position[], stride: number): Position[] {
    if (coords.length === 0) return []
    if (stride <= 1) return coords
    const samples: Position[] = []
    for (let i = 0; i < coords.length; i += stride) {
        const c = coords[i]
        if (c) samples.push(c)
    }
    const last = coords[coords.length - 1]
    if (last && samples[samples.length - 1] !== last) samples.push(last)
    return samples
}

export const routeCompareService = {
    /**
     * 경로 메타 지표 계산.
     * @param routeId 대상 경로 ID
     * @param paceMinPerKm 사용자 페이스 (분/km). 미지정 시 기본 6.
     */
    async computeMeta(routeId: string, paceMinPerKm?: number): Promise<RouteCompareMeta> {
        const routeRepo = await getRouteRepository()
        const sections = await routeRepo.getSectionsByRouteId(routeId)

        const allCoords: Position[] = sections.flatMap((s) => s.geom?.coordinates ?? [])

        const distanceKm = computeDistanceKm(allCoords)
        const ascentM = computeAscentM(allCoords)
        const descentM = computeDescentM(allCoords)
        const estimatedDurationMin = estimateDurationMin(distanceKm, paceMinPerKm)

        const facilityCounts: Record<string, number> = Object.fromEntries(
            FACILITY_TYPES.map((t) => [t, 0])
        )

        if (allCoords.length > 0) {
            const facilityRepo = await getFacilityRepository()
            const sampled = sampleCoords(allCoords, FACILITY_SAMPLE_STRIDE)
            const seen = new Set<string>()

            for (const pos of sampled) {
                const lng = pos[0]
                const lat = pos[1]
                if (lng === undefined || lat === undefined) continue
                const nearby = await facilityRepo.findNearby(
                    lat,
                    lng,
                    FACILITY_BUFFER_METERS,
                    FACILITY_TYPES
                )
                for (const f of nearby) {
                    const id = (f as { id?: string }).id
                    if (id && seen.has(id)) continue
                    if (id) seen.add(id)
                    facilityCounts[f.type] = (facilityCounts[f.type] ?? 0) + 1
                }
            }
        }

        return { distanceKm, ascentM, descentM, estimatedDurationMin, facilityCounts }
    }
}
