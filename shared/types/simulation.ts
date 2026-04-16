/** 시뮬레이션 카메라 위치 및 방향 정보 */
export interface CameraPosition {
    longitude: number
    latitude: number
    elevation: number
    heading: number
    pitch: number
}

/** 시뮬레이션 재생 중 현재 진행 상태 정보 */
export interface ProgressInfo {
    /** 시작점에서 현재 위치까지의 거리 (미터) */
    distanceFromStart: number
    /** 현재 고도 (미터) */
    currentElevation: number
    /** 현재 경사도 (%) */
    currentGradient: number
    /** 경로 전체 거리 (미터) */
    totalDistance: number
    /** 전체 진행률 (0~1) */
    progress: number
}

/** 재생 속도 배율 */
export type PlaybackSpeed = 1 | 2 | 5

/** 재생 상태 */
export type PlaybackState = 'stopped' | 'playing' | 'paused'
