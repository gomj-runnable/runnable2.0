import { distance, point } from '@turf/turf'
import type { GeoJsonPosition } from '#shared/types/geojson'
import type { RouteElevationProfile, RouteElevationSection, SavedSection } from '#shared/types/route'
import type { SectionPointRange } from '~/composables/action/useRouteDrawDraft'
import { geomToRouteDrawPositions, getSectionColor } from '~/composables/action/useRouteDrawUtils'

export { densifyPositions } from '~/composables/action/usePositionDensify'

/** 고도 프로필 생성 시 구간 하나를 표현하는 입력 데이터 */
export interface RouteElevationSectionInput {
    /** 구간 레이블 (사이드바 구간명 또는 기본값 `'구간 N'`) */
    label: string
    /** 그래프에서 이 구간을 표시할 색상 (CSS 문자열) */
    color: string
    /** 구간에 포함된 WGS84 좌표 배열 */
    positions: GeoJsonPosition[]
}

const DISTANCE_STEP_KM = 0.5

const isSamePosition = (left: GeoJsonPosition, right: GeoJsonPosition) =>
    left[0] === right[0] && left[1] === right[1] && (left[2] ?? 0) === (right[2] ?? 0)

const calculateDistanceMeters = (start: GeoJsonPosition, end: GeoJsonPosition) =>
    distance(point([start[0], start[1]]), point([end[0], end[1]]), { units: 'meters' })

const roundMetric = (value: number, precision = 1) => Number(value.toFixed(precision))

/**
 * 드래프트 드로잉에서 섹션 입력을 빌드한다.
 */
export const buildDraftSectionInputs = (
    positions: GeoJsonPosition[],
    ranges: SectionPointRange[],
    sectionNames?: Array<{ name?: string }>
): RouteElevationSectionInput[] =>
    ranges.map((range, index) => ({
        label: sectionNames?.[index]?.name?.trim() || `구간 ${index + 1}`,
        color: getSectionColor(index),
        positions: positions.slice(range.start, range.end + 1)
    }))

/**
 * 저장된 섹션에서 섹션 입력을 빌드한다.
 */
export const buildSavedSectionInputs = (sections: SavedSection[]): RouteElevationSectionInput[] =>
    sections.map((section, index) => ({
        label: section.attrs?.[0]?.name?.trim() || `구간 ${index + 1}`,
        color: getSectionColor(index),
        positions: geomToRouteDrawPositions(section.geom)
    }))

const normalizeSectionInputs = (sections: RouteElevationSectionInput[]) =>
    sections.filter((section) => section.positions.length > 0)

/**
 * 구간 입력 배열로부터 전체 경로의 거리-고도 프로필을 계산한다.
 * 누적 거리·고도 변화량·최고·최저 포인트를 포함한 프로필 객체를 반환한다.
 * 유효한 포인트가 없으면 `null`을 반환한다.
 *
 * @param sections - 고도 프로필을 계산할 구간 입력 배열
 * @returns 거리·고도 통계가 포함된 프로필 객체, 포인트가 없으면 `null`
 */
export const createRouteElevationProfile = (
    sections: RouteElevationSectionInput[]
): RouteElevationProfile | null => {
    const normalizedSections = normalizeSectionInputs(sections)

    if (normalizedSections.length === 0) {
        return null
    }

    let cumulativeDistanceKm = 0
    let elevationGain = 0
    let elevationLoss = 0
    const points: RouteElevationProfile['points'] = []
    const profileSections: RouteElevationSection[] = []
    let previousPosition: GeoJsonPosition | null = null

    normalizedSections.forEach((section) => {
        const sharesPreviousStart =
            !!previousPosition &&
            section.positions.length > 0 &&
            isSamePosition(previousPosition, section.positions[0]!)
        const startIndex = sharesPreviousStart && points.length > 0 ? points.length - 1 : points.length

        section.positions.forEach((position) => {
            if (!previousPosition || !isSamePosition(previousPosition, position)) {
                const elevation = position[2] ?? 0

                if (previousPosition) {
                    cumulativeDistanceKm +=
                        calculateDistanceMeters(previousPosition, position) / 1000

                    const elevationDelta = elevation - (previousPosition[2] ?? 0)

                    if (elevationDelta > 0) {
                        elevationGain += elevationDelta
                    } else if (elevationDelta < 0) {
                        elevationLoss += Math.abs(elevationDelta)
                    }
                }

                points.push({
                    distanceKm: roundMetric(cumulativeDistanceKm, 3),
                    elevation: roundMetric(elevation, 1)
                })
            }

            previousPosition = position
        })

        const endIndex = points.length - 1

        if (endIndex >= startIndex) {
            profileSections.push({
                label: section.label,
                color: section.color,
                startIndex,
                endIndex
            })
        }
    })

    if (points.length === 0) {
        return null
    }

    const highestPoint =
        points.reduce((highest, point) => (point.elevation > highest.elevation ? point : highest))
    const lowestPoint =
        points.reduce((lowest, point) => (point.elevation < lowest.elevation ? point : lowest))

    return {
        points,
        sections: profileSections,
        distanceKm: roundMetric(cumulativeDistanceKm, 3),
        minElevation: lowestPoint.elevation,
        maxElevation: highestPoint.elevation,
        elevationGain: roundMetric(elevationGain, 1),
        elevationLoss: roundMetric(elevationLoss, 1),
        highestPoint,
        lowestPoint
    }
}

/**
 * 드래프트 드로잉 포인트와 구간 범위로부터 고도 프로필을 생성한다.
 * `createRouteElevationProfile`의 편의 래퍼로, 범위 슬라이싱을 내부에서 처리한다.
 *
 * @param positions - 전체 드로잉 포인트 배열
 * @param ranges - 구간별 포인트 인덱스 범위 배열
 * @param sectionNames - 구간명 배열 (없으면 기본값 `'구간 N'` 사용)
 * @returns 거리·고도 프로필 객체 또는 `null`
 */
export const createRouteElevationProfileFromDraft = (
    positions: GeoJsonPosition[],
    ranges: SectionPointRange[],
    sectionNames?: Array<{ name?: string }>
) =>
    createRouteElevationProfile(
        ranges.map((range, index) => ({
            label: sectionNames?.[index]?.name?.trim() || `구간 ${index + 1}`,
            color: getSectionColor(index),
            positions: positions.slice(range.start, range.end + 1)
        }))
    )

/**
 * 저장된 구간 목록으로부터 고도 프로필을 생성한다.
 * 각 구간의 `geom`에서 좌표를 추출하여 `createRouteElevationProfile`에 전달한다.
 *
 * @param sections - 서버에서 불러온 저장된 구간 배열
 * @returns 거리·고도 프로필 객체 또는 `null`
 */
export const createRouteElevationProfileFromSections = (sections: SavedSection[]) =>
    createRouteElevationProfile(
        sections.map((section, index) => ({
            label: section.attrs?.[0]?.name?.trim() || `구간 ${index + 1}`,
            color: getSectionColor(index),
            positions: geomToRouteDrawPositions(section.geom)
        }))
    )

/**
 * 고도 그래프 X축에 표시할 거리 눈금 배열을 생성한다.
 * `DISTANCE_STEP_KM`(0.5km) 간격으로 0부터 `distanceKm`까지 생성한다.
 *
 * @param distanceKm - 전체 경로 거리 (km)
 * @returns 눈금 거리값 배열 (km 단위, 소수점 1자리)
 */
export const createDistanceTicks = (distanceKm: number) => {
    if (distanceKm <= 0) {
        return [0]
    }

    const tickCount = Math.max(1, Math.ceil(distanceKm / DISTANCE_STEP_KM))

    return Array.from({ length: tickCount + 1 }, (_, index) =>
        roundMetric(Math.min(index * DISTANCE_STEP_KM, distanceKm), 1)
    )
}
