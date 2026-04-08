import { defineEventHandler, createError } from 'h3'

const GEOJSON_URL = 'https://raw.githubusercontent.com/southkorea/seoul-maps/master/juso/2015/json/seoul_municipalities_geo_simple.json'

let cachedGeojson: unknown = null

export default defineEventHandler(async () => {
  if (cachedGeojson) {
    return cachedGeojson
  }

  try {
    const response = await fetch(GEOJSON_URL)
    if (!response.ok) {
      throw createError({ statusCode: 502, message: 'Failed to fetch boundary data' })
    }
    cachedGeojson = await response.json()
    return cachedGeojson
  } catch (err) {
    // 네트워크 실패 시 서울 25개 구 중심점으로 fallback (간소화 GeoJSON)
    return getFallbackSeoulGeojson()
  }
})

// Fallback: 서울 25구 GeoJSON (간소화 버전, polygon 없음 - 중심점 기반 circle로 대체)
function getFallbackSeoulGeojson() {
  return {
    type: 'FeatureCollection',
    features: SEOUL_GU_CENTERS.map(gu => ({
      type: 'Feature',
      properties: { SIG_KOR_NM: gu.name, SIG_CD: gu.code },
      geometry: {
        type: 'Polygon',
        coordinates: [generateCircleCoords(gu.lng, gu.lat, 0.02, 16)]
      }
    }))
  }
}

// 원형 좌표 생성 (fallback용)
function generateCircleCoords(cx: number, cy: number, r: number, n: number): [number, number][] {
  const coords: [number, number][] = []
  for (let i = 0; i <= n; i++) {
    const angle = (i / n) * 2 * Math.PI
    coords.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)])
  }
  return coords
}

const SEOUL_GU_CENTERS = [
  { name: '강남구', code: '11680', lat: 37.5172, lng: 127.0473 },
  { name: '강동구', code: '11740', lat: 37.5301, lng: 127.1238 },
  { name: '강북구', code: '11305', lat: 37.6396, lng: 127.0257 },
  { name: '강서구', code: '11500', lat: 37.5509, lng: 126.8495 },
  { name: '관악구', code: '11620', lat: 37.4784, lng: 126.9516 },
  { name: '광진구', code: '11215', lat: 37.5384, lng: 127.0822 },
  { name: '구로구', code: '11530', lat: 37.4955, lng: 126.8877 },
  { name: '금천구', code: '11545', lat: 37.4601, lng: 126.9001 },
  { name: '노원구', code: '11350', lat: 37.6541, lng: 127.0567 },
  { name: '도봉구', code: '11320', lat: 37.6688, lng: 127.0471 },
  { name: '동대문구', code: '11230', lat: 37.5744, lng: 127.0395 },
  { name: '동작구', code: '11590', lat: 37.5124, lng: 126.9392 },
  { name: '마포구', code: '11440', lat: 37.5663, lng: 126.9014 },
  { name: '서대문구', code: '11410', lat: 37.5791, lng: 126.9368 },
  { name: '서초구', code: '11650', lat: 37.4837, lng: 127.0324 },
  { name: '성동구', code: '11200', lat: 37.5633, lng: 127.0368 },
  { name: '성북구', code: '11290', lat: 37.5894, lng: 127.0167 },
  { name: '송파구', code: '11710', lat: 37.5145, lng: 127.1059 },
  { name: '양천구', code: '11470', lat: 37.5170, lng: 126.8666 },
  { name: '영등포구', code: '11560', lat: 37.5261, lng: 126.8962 },
  { name: '용산구', code: '11170', lat: 37.5311, lng: 126.9810 },
  { name: '은평구', code: '11380', lat: 37.6026, lng: 126.9291 },
  { name: '종로구', code: '11110', lat: 37.5735, lng: 126.9790 },
  { name: '중구', code: '11140', lat: 37.5640, lng: 126.9975 },
  { name: '중랑구', code: '11260', lat: 37.6066, lng: 127.0925 },
]
