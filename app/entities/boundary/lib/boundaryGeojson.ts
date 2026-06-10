export type BoundaryLevel = 'sgg' | 'emd'

export interface BoundaryFeature {
    properties: {
        NAME: string
        _labelPoint?: [number, number]
        [key: string]: unknown
    }
    geometry: {
        type: string
        coordinates: number[][][] | number[][][][]
    } | null
}

export interface BoundaryGeojson {
    type: string
    features: BoundaryFeature[]
}

/** 레벨별로 1회 로드한 FeatureCollection 을 보관하는 모듈 싱글턴 캐시 */
const cache = new Map<BoundaryLevel, BoundaryGeojson>()
/** 동시 호출 시 공유할 진행 중(in-flight) fetch Promise */
const inflight = new Map<BoundaryLevel, Promise<BoundaryGeojson>>()

/**
 * 행정경계 GeoJSON 을 레벨별로 로드한다.
 *
 * - 파일은 최초 1회만 fetch 하여 모듈 싱글턴(`cache`)으로 보관한다.
 * - 같은 레벨을 동시에 여러 번 호출하면 진행 중인 in-flight Promise 를 공유해
 *   중복 fetch 를 방지한다.
 * - 각 feature 의 라벨 위치는 파일에 이미 베이킹된 `_labelPoint` 를 그대로 사용한다.
 *   (런타임에서 라벨 좌표를 다시 계산하지 않는다.)
 */
export const loadBoundaryGeojson = async (level: BoundaryLevel): Promise<BoundaryGeojson> => {
    const cached = cache.get(level)
    if (cached) return cached

    const pending = inflight.get(level)
    if (pending) return pending

    const promise = $fetch<BoundaryGeojson>('/admin_area/' + level + '_4326.geojson')
        .then((data) => {
            cache.set(level, data)
            inflight.delete(level)
            return data
        })
        .catch((e) => {
            inflight.delete(level)
            throw e
        })

    inflight.set(level, promise)
    return promise
}
