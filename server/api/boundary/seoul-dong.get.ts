// GET /api/boundary/seoul-dong - 서울 읍면동(EMD) 경계 GeoJSON 반환
import { defineEventHandler } from 'h3'
import { getEmdBoundary } from '../../utils/district/boundary'

// 읍면동 경계 데이터를 반환하며, 오류 시 빈 FeatureCollection을 반환
export default defineEventHandler(async () => {
    try {
        return await getEmdBoundary()
    } catch {
        return { type: 'FeatureCollection', features: [] }
    }
})
