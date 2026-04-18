import type { CameraPosition, ProgressInfo } from '#shared/types/simulation'

/** 두 좌표 간 haversine 거리 (미터) */
export const haversineDistance = (a: number[], b: number[]): number => {
    const R = 6371000 // 지구 반지름 (미터)
    const toRad = (deg: number) => (deg * Math.PI) / 180

    const lat1 = toRad(a[1]!)
    const lat2 = toRad(b[1]!)
    const dLat = toRad(b[1]! - a[1]!)
    const dLon = toRad(b[0]! - a[0]!)

    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2

    return 2 * R * Math.asin(Math.sqrt(h))
}

/** 두 좌표 간 방위각(heading) 계산 (도 단위, 북 = 0) */
const calcHeading = (from: number[], to: number[]): number => {
    const toRad = (deg: number) => (deg * Math.PI) / 180
    const toDeg = (rad: number) => (rad * 180) / Math.PI

    const dLon = toRad(to[0]! - from[0]!)
    const lat1 = toRad(from[1]!)
    const lat2 = toRad(to[1]!)

    const y = Math.sin(dLon) * Math.cos(lat2)
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)

    return ((toDeg(Math.atan2(y, x)) % 360) + 360) % 360
}

/**
 * 경로 좌표 배열의 각 구간 거리 누적값을 계산한다.
 * @returns 각 포인트까지의 누적 거리 배열 (첫 번째는 0)
 */
const buildCumulativeDistances = (coordinates: number[][]): number[] => {
    const cumulative = [0]
    for (let i = 1; i < coordinates.length; i++) {
        const d = haversineDistance(coordinates[i - 1]!, coordinates[i]!)
        cumulative.push(cumulative[i - 1]! + d)
    }
    return cumulative
}

/**
 * 경로 전체 거리를 계산한다 (미터).
 */
export const calcTotalDistance = (coordinates: number[][]): number => {
    if (coordinates.length < 2) return 0
    const cum = buildCumulativeDistances(coordinates)
    return cum[cum.length - 1]!
}

/**
 * 진행률(0~1)에 대응하는 카메라 위치와 방향을 선형 보간으로 계산한다.
 * 고도에 +2m 눈높이 오프셋을 적용하고, pitch는 -15° 러너 시점을 기본으로 한다.
 *
 * @param coordinates - GeoJSON [경도, 위도, 고도] 배열
 * @param progress - 0(시작) ~ 1(종료)
 * @returns 카메라 위치·방향 정보
 */
export const interpolatePath = (coordinates: number[][], progress: number): CameraPosition => {
    if (coordinates.length === 0) {
        return { longitude: 0, latitude: 0, elevation: 0, heading: 0, pitch: -15 }
    }
    if (coordinates.length === 1) {
        const p = coordinates[0]!
        return { longitude: p[0]!, latitude: p[1]!, elevation: (p[2] ?? 0) + 2, heading: 0, pitch: -15 }
    }

    const cumulative = buildCumulativeDistances(coordinates)
    const totalDist = cumulative[cumulative.length - 1]!
    const targetDist = Math.max(0, Math.min(1, progress)) * totalDist

    // 목표 거리에 해당하는 구간 탐색
    let segIdx = 0
    for (let i = 1; i < cumulative.length; i++) {
        if (cumulative[i]! >= targetDist) {
            segIdx = i - 1
            break
        }
        segIdx = i - 1
    }

    // 마지막 지점 처리
    if (segIdx >= coordinates.length - 1) {
        const last = coordinates[coordinates.length - 1]!
        const prev = coordinates[coordinates.length - 2]!
        return {
            longitude: last[0]!,
            latitude: last[1]!,
            elevation: (last[2] ?? 0) + 2,
            heading: calcHeading(prev, last),
            pitch: -15
        }
    }

    const from = coordinates[segIdx]!
    const to = coordinates[segIdx + 1]!
    const segStart = cumulative[segIdx]!
    const segEnd = cumulative[segIdx + 1]!
    const segLen = segEnd - segStart

    // 구간 내 보간 비율 (0~1)
    const t = segLen > 0 ? (targetDist - segStart) / segLen : 0

    const lon = from[0]! + t * (to[0]! - from[0]!)
    const lat = from[1]! + t * (to[1]! - from[1]!)
    const elev = (from[2] ?? 0) + t * ((to[2] ?? 0) - (from[2] ?? 0))

    return {
        longitude: lon,
        latitude: lat,
        elevation: elev + 2, // 눈높이 오프셋
        heading: calcHeading(from, to),
        pitch: -15 // 러너 시점 기본 pitch
    }
}

/**
 * 진행률에 따른 경로 진행 정보를 계산한다.
 *
 * @param coordinates - GeoJSON [경도, 위도, 고도] 배열
 * @param progress - 0(시작) ~ 1(종료)
 * @returns 거리, 고도, 경사도 등 진행 정보
 */
export const getProgressInfo = (coordinates: number[][], progress: number): ProgressInfo => {
    if (coordinates.length === 0) {
        return { distanceFromStart: 0, currentElevation: 0, currentGradient: 0, totalDistance: 0, progress: 0 }
    }

    const cumulative = buildCumulativeDistances(coordinates)
    const totalDistance = cumulative[cumulative.length - 1]!
    const clampedProgress = Math.max(0, Math.min(1, progress))
    const distanceFromStart = clampedProgress * totalDistance

    // 현재 위치에 해당하는 구간 탐색
    let segIdx = 0
    for (let i = 1; i < cumulative.length; i++) {
        if (cumulative[i]! >= distanceFromStart) {
            segIdx = i - 1
            break
        }
        segIdx = i - 1
    }

    const from = coordinates[Math.min(segIdx, coordinates.length - 1)]!
    const to = coordinates[Math.min(segIdx + 1, coordinates.length - 1)]!

    const segStart = cumulative[segIdx]!
    const segEnd = cumulative[Math.min(segIdx + 1, cumulative.length - 1)]!
    const segLen = segEnd - segStart
    const t = segLen > 0 ? (distanceFromStart - segStart) / segLen : 0

    // 현재 고도 보간
    const currentElevation = (from[2] ?? 0) + t * ((to[2] ?? 0) - (from[2] ?? 0))

    // 경사도 계산: 고도 차 / 수평 거리 × 100 (%)
    const horizDist = haversineDistance(from, to)
    const elevDiff = (to[2] ?? 0) - (from[2] ?? 0)
    const currentGradient = horizDist > 0 ? (elevDiff / horizDist) * 100 : 0

    return {
        distanceFromStart,
        currentElevation,
        currentGradient,
        totalDistance,
        progress: clampedProgress
    }
}
