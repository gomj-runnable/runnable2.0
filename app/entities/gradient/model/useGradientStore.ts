import type { GradientSegment } from '#shared/types/gradient'
import type { DifficultyLevelEnum } from '#shared/types/difficulty-level.enum'

/**
 * 경사도 시각화 레이어 및 난이도 상태를 관리하는 store composable.
 */
export const useGradientStore = () => {
    /** 경사도 색상 폴리라인 레이어 표시 여부 */
    const isGradientVisible = useState<boolean>('gradient.isVisible', () => false)

    /** 현재 경로의 난이도. 경로가 없으면 null. */
    const currentDifficulty = useState<DifficultyLevelEnum | null>(
        'gradient.currentDifficulty',
        () => null
    )

    /** 현재 경로의 구간별 경사도 세그먼트 배열 */
    const gradientSegments = useState<GradientSegment[]>('gradient.segments', () => [])

    const toggleGradient = () => {
        isGradientVisible.value = !isGradientVisible.value
    }

    const showGradient = () => {
        isGradientVisible.value = true
    }

    const hideGradient = () => {
        isGradientVisible.value = false
    }

    const setDifficulty = (level: DifficultyLevelEnum | null) => {
        currentDifficulty.value = level
    }

    const setSegments = (segments: GradientSegment[]) => {
        gradientSegments.value = segments
    }

    const resetGradient = () => {
        isGradientVisible.value = false
        currentDifficulty.value = null
        gradientSegments.value = []
    }

    return {
        isGradientVisible,
        currentDifficulty,
        gradientSegments,
        toggleGradient,
        showGradient,
        hideGradient,
        setDifficulty,
        setSegments,
        resetGradient
    }
}
