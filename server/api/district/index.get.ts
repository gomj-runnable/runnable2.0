// GET /api/district - 서울 구/동 행정구역 메타데이터 반환 (메모리 캐시)
import type { SeoulDistrictData } from '#shared/types/district'
import { SEOUL_GU_DATA } from '../../utils/district/seoul-gu-data'
import { SEOUL_DONG_MAP } from '../../utils/district/seoul-dong-data'

let cached: SeoulDistrictData | null = null

export default defineEventHandler((): SeoulDistrictData => {
    if (!cached) {
        cached = { gu: SEOUL_GU_DATA, dongMap: SEOUL_DONG_MAP }
    }
    return cached
})
