import { defineEventHandler } from 'h3'

const GEOJSON_URL =
    'https://raw.githubusercontent.com/southkorea/seoul-maps/master/kostat/2013/json/seoul_submunicipalities_geo_simple.json'

let cachedGeojson: unknown = null

export default defineEventHandler(async () => {
    if (cachedGeojson) {
        return cachedGeojson
    }

    try {
        const response = await fetch(GEOJSON_URL)
        if (!response.ok) {
            throw new Error('Failed to fetch dong boundary data')
        }
        cachedGeojson = await response.json()
        return cachedGeojson
    } catch {
        return { type: 'FeatureCollection', features: [] }
    }
})
