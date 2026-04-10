import type { GeoJsonPosition } from '#shared/types/geojson'
import type { RouteElevationProfile, RouteElevationSection, SavedSection } from '#shared/types/route'
import type { SectionPointRange } from '~/composables/action/useRouteDrawDraft'
import { geomToRouteDrawPositions, getSectionColor } from '~/composables/action/useRouteDrawUtils'

export interface RouteElevationSectionInput {
    label: string
    color: string
    positions: GeoJsonPosition[]
}

const EARTH_RADIUS_METERS = 6371008.8
const DISTANCE_STEP_KM = 0.5

const toRadians = (degrees: number) => (degrees * Math.PI) / 180

const isSamePosition = (left: GeoJsonPosition, right: GeoJsonPosition) =>
    left[0] === right[0] && left[1] === right[1] && (left[2] ?? 0) === (right[2] ?? 0)

const calculateDistanceMeters = (start: GeoJsonPosition, end: GeoJsonPosition) => {
    const [startLng, startLat] = start
    const [endLng, endLat] = end
    const latitudeDelta = toRadians(endLat - startLat)
    const longitudeDelta = toRadians(endLng - startLng)
    const startLatitude = toRadians(startLat)
    const endLatitude = toRadians(endLat)
    const haversine =
        Math.sin(latitudeDelta / 2) ** 2 +
        Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDelta / 2) ** 2

    return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}

const roundMetric = (value: number, precision = 1) => Number(value.toFixed(precision))


const DENSIFY_STEP_METERS = 50

/**
 * 경로 위치 배열을 일정 간격(기본 50m)으로 보간하여 밀도를 높인다.
 * 고도는 0으로 초기화되며, 이후 지형 샘플링으로 채워진다.
 */
export const densifyPositions = (
    positions: GeoJsonPosition[],
    stepMeters: number = DENSIFY_STEP_METERS
): GeoJsonPosition[] => {
    if (positions.length < 2) return [...positions]

    const result: GeoJsonPosition[] = []

    for (let i = 0; i < positions.length - 1; i++) {
        const start = positions[i]!
        const end = positions[i + 1]!
        const distance = calculateDistanceMeters(start, end)
        const steps = Math.max(1, Math.ceil(distance / stepMeters))

        for (let j = 0; j < steps; j++) {
            const t = j / steps
            result.push([
                start[0] + t * (end[0] - start[0]),
                start[1] + t * (end[1] - start[1]),
                0
            ])
        }
    }

    result.push([...positions[positions.length - 1]!])
    return result
}

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

export const createRouteElevationProfileFromSections = (sections: SavedSection[]) =>
    createRouteElevationProfile(
        sections.map((section, index) => ({
            label: section.attrs?.[0]?.name?.trim() || `구간 ${index + 1}`,
            color: getSectionColor(index),
            positions: geomToRouteDrawPositions(section.geom)
        }))
    )

export const createDistanceTicks = (distanceKm: number) => {
    if (distanceKm <= 0) {
        return [0]
    }

    const tickCount = Math.max(1, Math.ceil(distanceKm / DISTANCE_STEP_KM))

    return Array.from({ length: tickCount + 1 }, (_, index) =>
        roundMetric(Math.min(index * DISTANCE_STEP_KM, distanceKm), 1)
    )
}
