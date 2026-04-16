/**
 * 경사도 시각화 및 난이도 분류에 사용하는 공유 타입 정의.
 */

/** 경로 난이도 레벨 */
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

/** 경로 구간별 경사도 정보 */
export interface GradientSegment {
    /** 시작 포인트 인덱스 */
    startIndex: number
    /** 끝 포인트 인덱스 */
    endIndex: number
    /** 경사도 (%) */
    gradient: number
    /** 경사도에 대응하는 CSS 색상 문자열 */
    color: string
}
