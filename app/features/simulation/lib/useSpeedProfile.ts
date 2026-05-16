import { haversineDistance } from '~/features/camera/lib/useFlythroughAction'
import type { useSectionInfoStore } from '~/entities/route/model/useSectionInfoStore'
import { calculateSectionDistance } from '~/entities/route/lib/usePaceCalculator'

/** 기본 페이스: 6:00/km = 360초/km */
export const DEFAULT_PACE_SEC_PER_KM = 360

export interface SpeedProfile {
    totalDurationMs: number
    cumulativeTimeFractions: number[]
}

/**
 * 구간별 페이스를 기반으로 전체 소요 시간과 시간-거리 매핑을 미리 계산한다.
 * 구간 데이터가 없으면 기본 페이스(6:00/km)를 사용한다.
 */
export const buildSpeedProfile = (
    coordinates: number[][],
    sectionInfo: ReturnType<typeof useSectionInfoStore>
): SpeedProfile => {
    const sections = sectionInfo.sections.value
    const userPaces = sectionInfo.userPaces.value

    // 각 좌표 세그먼트의 거리(m)를 계산
    const segmentDistances: number[] = [0]
    for (let i = 1; i < coordinates.length; i++) {
        segmentDistances.push(haversineDistance(coordinates[i - 1]!, coordinates[i]!))
    }

    // 구간별 좌표 범위와 페이스를 매핑
    // 구간 데이터가 있으면 각 구간의 거리 누적으로 좌표가 어느 구간에 속하는지 판별
    const sectionBoundaries: { endDistance: number; paceSecPerKm: number }[] = []

    if (sections.length > 0) {
        let cumDist = 0
        for (const section of sections) {
            const sectionDistKm = calculateSectionDistance(section)
            cumDist += sectionDistKm * 1000 // m 단위
            const pace = userPaces[section.sectionId]?.pace ?? DEFAULT_PACE_SEC_PER_KM
            sectionBoundaries.push({ endDistance: cumDist, paceSecPerKm: pace })
        }
    }

    // 각 좌표의 누적 거리와 소요 시간 계산
    const cumulativeTime: number[] = [0]
    let totalDist = 0

    for (let i = 1; i < coordinates.length; i++) {
        totalDist += segmentDistances[i]!

        // 현재 좌표가 속하는 구간의 페이스 결정
        let paceSecPerKm = DEFAULT_PACE_SEC_PER_KM
        if (sectionBoundaries.length > 0) {
            for (const boundary of sectionBoundaries) {
                if (totalDist <= boundary.endDistance) {
                    paceSecPerKm = boundary.paceSecPerKm
                    break
                }
            }
            // 마지막 구간을 넘어선 좌표는 마지막 구간 페이스 사용
            if (totalDist > sectionBoundaries[sectionBoundaries.length - 1]!.endDistance) {
                paceSecPerKm = sectionBoundaries[sectionBoundaries.length - 1]!.paceSecPerKm
            }
        }

        // 이 세그먼트의 소요 시간 = 거리(km) × 페이스(초/km)
        const segmentTimeMs = (segmentDistances[i]! / 1000) * paceSecPerKm * 1000
        cumulativeTime.push(cumulativeTime[i - 1]! + segmentTimeMs)
    }

    const totalTimeMs = cumulativeTime[cumulativeTime.length - 1] ?? 10000
    const totalDurationMs = totalTimeMs > 0 ? totalTimeMs : 10000

    // 시간 비율 배열 생성 (progress 0~1 → 시간 기반)
    const cumulativeTimeFractions = cumulativeTime.map((t) => t / totalDurationMs)

    return { totalDurationMs, cumulativeTimeFractions }
}

/**
 * 시간 기반 progress(0~1)를 거리 기반 progress(0~1)로 변환한다.
 * 구간별 페이스가 다르면 빠른 구간은 같은 시간에 더 많은 거리를 이동한다.
 */
export const timeToDistanceProgress = (
    timeProgress: number,
    cumulativeTimeFractions: number[]
): number => {
    const len = cumulativeTimeFractions.length
    if (len < 2) return timeProgress

    // 이진 탐색으로 timeProgress가 속하는 세그먼트를 찾는다
    let lo = 1
    let hi = len - 1
    while (lo < hi) {
        const mid = (lo + hi) >>> 1
        if (cumulativeTimeFractions[mid]! < timeProgress) lo = mid + 1
        else hi = mid
    }

    const i = lo
    const prevTime = cumulativeTimeFractions[i - 1]!
    const currTime = cumulativeTimeFractions[i]!
    const segmentRatio = currTime > prevTime ? (timeProgress - prevTime) / (currTime - prevTime) : 0

    const prevDist = (i - 1) / (len - 1)
    const currDist = i / (len - 1)
    return prevDist + segmentRatio * (currDist - prevDist)
}
