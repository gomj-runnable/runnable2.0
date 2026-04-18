/** 서울시 시군구 메타데이터 */
export interface SeoulGuMeta {
    /** 시군구 이름 (예: '강남구') */
    name: string
    /** 행정구역 코드 (예: '11680') */
    code: string
    /** 중심 경도 */
    lng: number
    /** 중심 위도 */
    lat: number
    /** KMA 기상청 격자 X */
    nx: number
    /** KMA 기상청 격자 Y */
    ny: number
}

/** 시군구-법정동 매핑 (구 이름 → 동 이름 배열) */
export type SeoulDongMap = Record<string, string[]>

/** /api/district 응답 타입 */
export interface SeoulDistrictData {
    gu: SeoulGuMeta[]
    dongMap: SeoulDongMap
}
