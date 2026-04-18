import { defineEventHandler } from 'h3'
import { getSggBoundary } from '../../utils/district/boundary'
import { SEOUL_GU_DATA } from '../../utils/district/seoul-gu-data'

export default defineEventHandler(async () => {
  try {
    return await getSggBoundary()
  } catch {
    return getFallbackSeoulGeojson()
  }
})

function getFallbackSeoulGeojson() {
  return {
    type: 'FeatureCollection',
    features: SEOUL_GU_DATA.map(gu => ({
      type: 'Feature',
      properties: { SIG_KOR_NM: gu.name, SIG_CD: gu.code },
      geometry: {
        type: 'Polygon',
        coordinates: [generateCircleCoords(gu.lng, gu.lat, 0.02, 16)]
      }
    }))
  }
}

function generateCircleCoords(cx: number, cy: number, r: number, n: number): [number, number][] {
  const coords: [number, number][] = []
  for (let i = 0; i <= n; i++) {
    const angle = (i / n) * 2 * Math.PI
    coords.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)])
  }
  return coords
}
