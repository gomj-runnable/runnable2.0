export interface SectionAttr {
    seq: number
    speed?: number
    time?: string
}

export interface Section {
    sectionId: string
    routeId: string
    /** GEOMETRY(LineStringZ, 4326) - 경도/위도/고도 포함 */
    geom?: string
    /** 각 Point별 속성 배열 */
    attrs?: SectionAttr[]
}

export interface Route {
    routeId: string
    title: string
    descript?: string
    highHeight?: number
    lowHeight?: number
    distance?: number
}

/** API 응답으로 반환되는 저장된 경로 객체 */
export interface SavedRoute {
    routeId: string
    title: string
    description?: string
    highHeight?: number
    lowHeight?: number
    distance?: number
}

/** API 응답으로 반환되는 저장된 구간 객체 */
export interface SavedSection {
    sectionId: string
    routeId: string
    geom?: string
    attrs?: Array<{ seq: number; name?: string; comment?: string; description?: string }>
}
