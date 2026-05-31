// GET /api/boundary/seoul - 서울 시군구(SGG) 경계 GeoJSON 반환, 실패 시 원형 폴리곤으로 폴백
import { defineEventHandler } from 'h3'
import { getSggBoundary } from '../../utils/district/boundary'
import { SEOUL_GU_DATA } from '../../utils/district/seoul-gu-data'

// 시군구 경계를 반환하며, 오류 시 구 중심점 기반 원형 폴리곤으로 대체
export default defineEventHandler(async () => {
    try {
        return await getSggBoundary()
    } catch {
        return getFallbackSeoulGeojson()
    }
})

// 구 중심 좌표를 기반으로 원형 폴리곤 GeoJSON을 생성하는 폴백 함수
function getFallbackSeoulGeojson() {
    return {
        type: 'FeatureCollection',
        features: SEOUL_GU_DATA.map((gu) => ({
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
