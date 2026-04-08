import type { GeoJsonPosition } from '#shared/types/geojson'
import type { RouteElevationProfile, RouteElevationSection, SavedSection } from '#shared/types/route'
import { SECTION_COLORS } from '#shared/constants/route'
import type { SectionPointRange } from '~/composables/action/useRouteDrawDraft'
import { geomToRouteDrawPositions } from '~/composables/action/useRouteDrawUtils'

interface RouteElevationSectionInput {
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

const toSectionColor = (index: number) =>
    SECTION_COLORS[index % SECTION_COLORS.length] ?? SECTION_COLORS[0]

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
            color: toSectionColor(index),
            positions: positions.slice(range.start, range.end + 1)
        }))
    )

export const createRouteElevationProfileFromSections = (sections: SavedSection[]) =>
    createRouteElevationProfile(
        sections.map((section, index) => ({
            label: section.attrs?.[0]?.name?.trim() || `구간 ${index + 1}`,
            color: toSectionColor(index),
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
