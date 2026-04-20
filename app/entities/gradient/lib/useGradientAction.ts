import { distance, point } from '@turf/turf'
import type { GradientSegment } from '#shared/types/gradient'
import type { GeoJsonPosition } from '#shared/types/geojson'
import { DifficultyLevelEnum } from '#shared/types/difficulty-level.enum'

/**
 * 경사도 계산 및 난이도 분류를 위한 순수 계산 action composable.
 * 외부 API, 전역 상태, 브라우저 IO에 의존하지 않는다.
 */
export const useGradientAction = () => {
    // ─── 경사도 색상 기준 ────────────────────────────────────────────
    // 0~3%: 초록, 3~7%: 노랑, 7~12%: 주황, 12%+: 빨강

    /**
     * 경사도(%)에 대응하는 CSS 색상 문자열을 반환한다.
     *
     * @param gradientPercent - 경사도 절댓값 (%)
     * @returns CSS 색상 문자열
     */
    const getGradientColor = (gradientPercent: number): string => {
        const abs = Math.abs(gradientPercent)
        if (abs < 3) return '#4CAF50'
        if (abs < 7) return '#FFC107'
        if (abs < 12) return '#FF9800'
        return '#F44336'
    }

    /**
     * GeoJSON Position 배열에서 구간별 경사도를 계산한다.
     * 수평 거리는 turf.distance로 구하고, 고도 차이는 elevation 인덱스(2)에서 읽는다.
     *
     * @param coordinates - `[longitude, latitude, elevation]` 형태의 좌표 배열
     * @returns 구간별 경사도 정보 배열. 포인트가 2개 미만이면 빈 배열.
     */
    const calculateSegmentGradients = (coordinates: GeoJsonPosition[]): GradientSegment[] => {
        if (coordinates.length < 2) return []

        return coordinates.slice(0, -1).map((start, i) => {
            const end = coordinates[i + 1]!

            // 수평 거리 (미터)
            const horizontalDistanceM = distance(
                point([start[0], start[1]]),
                point([end[0], end[1]]),
                {
                    units: 'meters'
                }
            )

            // 고도 차이 (미터)
            const elevationDiff = (end[2] ?? 0) - (start[2] ?? 0)

            // 수평 거리가 0이면 경사도 0으로 처리
            const gradient =
                horizontalDistanceM > 0 ? (elevationDiff / horizontalDistanceM) * 100 : 0

            return {
                startIndex: i,
                endIndex: i + 1,
                gradient,
                color: getGradientColor(gradient)
            }
        })
    }

    /**
     * 총 거리·누적 상승고도·최대 경사도를 조합해 경로 난이도를 분류한다.
     *
     * | 기준 | 초급 | 중급 | 고급 | 전문가 |
     * |------|------|------|------|--------|
     * | 거리(km) | ~5 | ~10 | ~20 | 20+ |
     * | 누적 상승(m) | ~100 | ~300 | ~600 | 600+ |
     * | 최대 경사(%) | ~3 | ~7 | ~12 | 12+ |
     *
     * 세 기준 중 가장 높은 등급을 최종 난이도로 채택한다.
     *
     * @param distanceKm - 경로 총 거리 (km)
     * @param elevGain - 누적 상승고도 (m)
     * @param maxGrad - 최대 경사도 절댓값 (%)
     * @returns 난이도 레벨
     */
    const classifyDifficulty = (
        distanceKm: number,
        elevGain: number,
        maxGrad: number
    ): DifficultyLevelEnum => {
        const byDistance =
            distanceKm > 20
                ? DifficultyLevelEnum.EXPERT
                : distanceKm > 10
                  ? DifficultyLevelEnum.ADVANCED
                  : distanceKm > 5
                    ? DifficultyLevelEnum.INTERMEDIATE
                    : DifficultyLevelEnum.BEGINNER

        const byElevGain =
            elevGain > 600
                ? DifficultyLevelEnum.EXPERT
                : elevGain > 300
                  ? DifficultyLevelEnum.ADVANCED
                  : elevGain > 100
                    ? DifficultyLevelEnum.INTERMEDIATE
                    : DifficultyLevelEnum.BEGINNER

        const byGradient =
            maxGrad > 12
                ? DifficultyLevelEnum.EXPERT
                : maxGrad > 7
                  ? DifficultyLevelEnum.ADVANCED
                  : maxGrad > 3
                    ? DifficultyLevelEnum.INTERMEDIATE
                    : DifficultyLevelEnum.BEGINNER

        return DifficultyLevelEnum.max(DifficultyLevelEnum.max(byDistance, byElevGain), byGradient)
    }

    return { calculateSegmentGradients, classifyDifficulty, getGradientColor }
}
