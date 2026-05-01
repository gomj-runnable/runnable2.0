import { booleanPointInPolygon, point } from '@turf/turf'
import type { FeatureCollection, Feature, Polygon, MultiPolygon } from 'geojson'
import { getSggBoundary, getEmdBoundary } from './district/boundary'
import { GU_BY_CODE } from './district/seoul-gu-data'

type PolygonFeature = Feature<Polygon | MultiPolygon>

/** EMD features를 부모 시군구별로 그룹화한 캐시 */
let emdByGuPromise: Promise<Map<string, PolygonFeature[]>> | null = null

function getEmdByGu(): Promise<Map<string, PolygonFeature[]>> {
    if (!emdByGuPromise) {
        emdByGuPromise = getEmdBoundary().then((geo) => {
            const map = new Map<string, PolygonFeature[]>()
            for (const f of geo.features) {
                if (!isPolygonFeature(f)) continue
                const guCode = (f.properties?.EMD_CD as string)?.substring(0, 5)
                const gu = guCode ? GU_BY_CODE.get(guCode)?.name : undefined
                if (!gu) continue
                let list = map.get(gu)
                if (!list) {
                    list = []
                    map.set(gu, list)
                }
                list.push(f as PolygonFeature)
            }
            return map
        })
    }
    return emdByGuPromise
}

/**
 * 좌표 배열에서 경유하는 시군구/읍면동 이름 목록을 반환한다.
 * 성능을 위해 좌표를 샘플링한다 (최대 50개 포인트).
 */
export async function lookupDistricts(
    coordinates: [number, number][]
): Promise<{ sgg: string[]; emd: string[] }> {
    if (coordinates.length === 0) return { sgg: [], emd: [] }

    const step = Math.max(1, Math.floor(coordinates.length / 50))
    const sampled = coordinates.filter((_, i) => i % step === 0)
    const last = coordinates[coordinates.length - 1]
    if (last && sampled[sampled.length - 1] !== last) sampled.push(last)

    let sggGeo: FeatureCollection
    let emdByGu: Map<string, PolygonFeature[]>
    try {
        ;[sggGeo, emdByGu] = await Promise.all([getSggBoundary(), getEmdByGu()])
    } catch {
        return { sgg: [], emd: [] }
    }

    const sggSet = new Set<string>()
    const emdSet = new Set<string>()

    for (const coord of sampled) {
        const pt = point(coord)

        let matchedGu: string | null = null
        for (const feature of sggGeo.features) {
            if (!isPolygonFeature(feature)) continue
            const name = feature.properties?.SIG_KOR_NM as string | undefined
            if (!name) continue
            if (booleanPointInPolygon(pt, feature as PolygonFeature)) {
                sggSet.add(name)
                matchedGu = name
                break
            }
        }

        if (matchedGu) {
            const guFeatures = emdByGu.get(matchedGu)
            if (guFeatures) {
                for (const feature of guFeatures) {
                    const name = feature.properties?.EMD_KOR_NM as string | undefined
                    if (!name) continue
                    if (booleanPointInPolygon(pt, feature)) {
                        emdSet.add(name)
                        break
                    }
                }
            }
        }
    }

    return {
        sgg: Array.from(sggSet),
        emd: Array.from(emdSet)
    }
}

function isPolygonFeature(f: Feature): f is PolygonFeature {
    return f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon'
}
