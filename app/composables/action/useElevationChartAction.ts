import type { RouteElevationPoint, RouteElevationProfile } from '#shared/types/route'

/** SVG 차트의 전체 크기와 내부 여백을 정의하는 치수 객체 */
export interface ChartDimensions {
    /** SVG 전체 너비 (px) */
    width: number
    /** SVG 전체 높이 (px) */
    height: number
    /** 차트 내부 여백 (상·우·하·좌, px) */
    padding: { top: number; right: number; bottom: number; left: number }
}

export type RenderedPoint = RouteElevationPoint & { x: number; y: number }
export type RenderedSectionSegment = RouteElevationProfile['sections'][number] & { path: string }

export interface ChartGeometry {
    baselineY: number
    distanceTicks: { value: number; x: number }[]
    linePoints: RenderedPoint[]
    areaPath: string
    sectionSegments: RenderedSectionSegment[]
    highestPoint: RenderedPoint | null
    lowestPoint: RenderedPoint | null
}

function calcMinMaxElevation(points: RouteElevationPoint[]): { min: number; max: number } {
    return points.reduce(
        (acc, point) => ({
            min: point.elevation < acc.min ? point.elevation : acc.min,
            max: point.elevation > acc.max ? point.elevation : acc.max
        }),
        { min: points[0]!.elevation, max: points[0]!.elevation }
    )
}

function round2(value: number): number {
    return Math.round(value * 100) / 100
}

function mapLinePoints(
    points: RouteElevationPoint[],
    scaleX: (distanceKm: number) => number,
    scaleY: (elevation: number) => number
): RenderedPoint[] {
    return points.map((point) => ({
        x: round2(scaleX(point.distanceKm)),
        y: round2(scaleY(point.elevation)),
        distanceKm: point.distanceKm,
        elevation: point.elevation
    }))
}

function buildSvgPaths(
    linePoints: RenderedPoint[],
    baselineY: number,
    paddingLeft: number
): { linePath: string; areaPath: string } {
    const linePath = linePoints
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' ')
    const areaPath = `${linePath} L ${linePoints.at(-1)?.x ?? paddingLeft} ${baselineY} L ${linePoints[0]?.x ?? paddingLeft} ${baselineY} Z`
    return { linePath, areaPath }
}

function mapSectionSegments(
    sections: RouteElevationProfile['sections'],
    linePoints: RenderedPoint[]
): RenderedSectionSegment[] {
    return sections
        .map((section) => {
            const sectionPoints = linePoints.slice(section.startIndex, section.endIndex + 1)
            if (sectionPoints.length < 2) {
                return null
            }
            return {
                ...section,
                path: sectionPoints
                    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
                    .join(' ')
            }
        })
        .filter((section): section is RenderedSectionSegment => section !== null)
}

function findRenderedPoint(
    linePoints: RenderedPoint[],
    target: RouteElevationPoint
): RenderedPoint | null {
    return (
        linePoints.find(
            (point) =>
                point.distanceKm === target.distanceKm && point.elevation === target.elevation
        ) ?? null
    )
}

/**
 * 고도 프로필과 차트 치수로부터 SVG 렌더링에 필요한 모든 좌표 데이터를 계산한다.
 * 스케일 함수, 라인 포인트, 면적 경로, 구간 세그먼트, 최고·최저 포인트를 포함한다.
 *
 * @param profile - `createRouteElevationProfile`이 반환한 고도 프로필
 * @param distanceTicks - X축 눈금 거리 배열 (km)
 * @param dimensions - SVG 차트의 전체 크기와 패딩
 * @returns SVG 렌더링에 사용할 차트 기하 데이터. 포인트가 없으면 `null`.
 */
export function calcChartGeometry(
    profile: RouteElevationProfile,
    distanceTicks: number[],
    dimensions: ChartDimensions
): ChartGeometry | null {
    const { points } = profile
    if (points.length === 0) {
        return null
    }

    const chartWidth = dimensions.width - dimensions.padding.left - dimensions.padding.right
    const chartHeight = dimensions.height - dimensions.padding.top - dimensions.padding.bottom
    const maxDistance = Math.max(profile.distanceKm, 0.001)

    const { min: minElevation, max: maxElevation } = calcMinMaxElevation(points)
    const elevationRange = Math.max(maxElevation - minElevation, 1)
    const elevationPadding = Math.max(elevationRange * 0.18, 12)
    const lowerBound = minElevation - elevationPadding
    const upperBound = maxElevation + elevationPadding

    const scaleX = (distanceKm: number) =>
        dimensions.padding.left + (distanceKm / maxDistance) * chartWidth
    const scaleY = (elevation: number) =>
        dimensions.padding.top +
        ((upperBound - elevation) / (upperBound - lowerBound)) * chartHeight

    const linePoints = mapLinePoints(points, scaleX, scaleY)
    const baselineY = dimensions.padding.top + chartHeight
    const { areaPath } = buildSvgPaths(linePoints, baselineY, dimensions.padding.left)

    const mappedTicks = distanceTicks.map((distanceKm) => ({
        value: distanceKm,
        x: round2(scaleX(distanceKm))
    }))

    const sectionSegments = mapSectionSegments(profile.sections, linePoints)

    return {
        baselineY,
        distanceTicks: mappedTicks,
        linePoints,
        areaPath,
        sectionSegments,
        highestPoint: findRenderedPoint(linePoints, profile.highestPoint),
        lowestPoint: findRenderedPoint(linePoints, profile.lowestPoint)
    }
}
