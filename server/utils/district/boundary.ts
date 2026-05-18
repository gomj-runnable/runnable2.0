import type { FeatureCollection } from 'geojson'

const SGG_URL =
    'https://raw.githubusercontent.com/southkorea/seoul-maps/master/juso/2015/json/seoul_municipalities_geo_simple.json'
const EMD_URL =
    'https://raw.githubusercontent.com/southkorea/seoul-maps/master/juso/2015/json/seoul_neighborhoods_geo_simple.json'

let sggPromise: Promise<FeatureCollection> | null = null
let emdPromise: Promise<FeatureCollection> | null = null

async function fetchGeoJson(url: string): Promise<FeatureCollection> {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
    if (!res.ok) throw new Error(`Failed to fetch: ${url}`)
    return res.json() as Promise<FeatureCollection>
}

/** 시군구 boundary GeoJSON (Promise 캐싱) */
export function getSggBoundary(): Promise<FeatureCollection> {
    if (!sggPromise) sggPromise = fetchGeoJson(SGG_URL)
    return sggPromise
}

/** 법정동 boundary GeoJSON (Promise 캐싱) */
export function getEmdBoundary(): Promise<FeatureCollection> {
    if (!emdPromise) emdPromise = fetchGeoJson(EMD_URL)
    return emdPromise
}
