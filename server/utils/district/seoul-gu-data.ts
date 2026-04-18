import type { SeoulGuMeta } from '#shared/types/district'

/**
 * 서울시 25개 시군구 통합 메타데이터.
 * 좌표(lng/lat)는 seoul.get.ts SEOUL_GU_CENTERS 기준으로 통일.
 * KMA 격자(nx/ny)는 weather/common.ts SEOUL_GU_GRID 기준.
 */
export const SEOUL_GU_DATA: SeoulGuMeta[] = [
    { name: '강남구', code: '11680', lng: 127.0473, lat: 37.5172, nx: 61, ny: 126 },
    { name: '강동구', code: '11740', lng: 127.1238, lat: 37.5301, nx: 62, ny: 126 },
    { name: '강북구', code: '11305', lng: 127.0257, lat: 37.6396, nx: 61, ny: 128 },
    { name: '강서구', code: '11500', lng: 126.8495, lat: 37.5509, nx: 58, ny: 126 },
    { name: '관악구', code: '11620', lng: 126.9516, lat: 37.4784, nx: 59, ny: 125 },
    { name: '광진구', code: '11215', lng: 127.0822, lat: 37.5384, nx: 62, ny: 127 },
    { name: '구로구', code: '11530', lng: 126.8877, lat: 37.4955, nx: 58, ny: 125 },
    { name: '금천구', code: '11545', lng: 126.9001, lat: 37.4601, nx: 59, ny: 124 },
    { name: '노원구', code: '11350', lng: 127.0567, lat: 37.6541, nx: 61, ny: 129 },
    { name: '도봉구', code: '11320', lng: 127.0471, lat: 37.6688, nx: 61, ny: 129 },
    { name: '동대문구', code: '11230', lng: 127.0395, lat: 37.5744, nx: 61, ny: 127 },
    { name: '동작구', code: '11590', lng: 126.9392, lat: 37.5124, nx: 59, ny: 126 },
    { name: '마포구', code: '11440', lng: 126.9014, lat: 37.5663, nx: 59, ny: 127 },
    { name: '서대문구', code: '11410', lng: 126.9368, lat: 37.5791, nx: 59, ny: 127 },
    { name: '서초구', code: '11650', lng: 127.0324, lat: 37.4837, nx: 61, ny: 125 },
    { name: '성동구', code: '11200', lng: 127.0368, lat: 37.5633, nx: 61, ny: 127 },
    { name: '성북구', code: '11290', lng: 127.0167, lat: 37.5894, nx: 61, ny: 127 },
    { name: '송파구', code: '11710', lng: 127.1059, lat: 37.5145, nx: 62, ny: 126 },
    { name: '양천구', code: '11470', lng: 126.8666, lat: 37.5170, nx: 58, ny: 126 },
    { name: '영등포구', code: '11560', lng: 126.8962, lat: 37.5261, nx: 58, ny: 126 },
    { name: '용산구', code: '11170', lng: 126.9810, lat: 37.5311, nx: 60, ny: 126 },
    { name: '은평구', code: '11380', lng: 126.9291, lat: 37.6026, nx: 59, ny: 127 },
    { name: '종로구', code: '11110', lng: 126.9790, lat: 37.5735, nx: 60, ny: 127 },
    { name: '중구', code: '11140', lng: 126.9975, lat: 37.5640, nx: 60, ny: 127 },
    { name: '중랑구', code: '11260', lng: 127.0925, lat: 37.6066, nx: 62, ny: 128 },
]

/** code → SeoulGuMeta (O(1) 조회) */
export const GU_BY_CODE = new Map(SEOUL_GU_DATA.map(g => [g.code, g]))

/** name → SeoulGuMeta (O(1) 조회) */
export const GU_BY_NAME = new Map(SEOUL_GU_DATA.map(g => [g.name, g]))
