/**
 * 비동기 액션이 정상 완료되었을 때의 공통 응답 구조.
 * `data`에 액션 결과가 담기고, `state`로 완료 상태를 구분한다.
 */
export interface CommonResponse<TData = unknown> {
    data?: TData
    state?: 'success'
}

/**
 * 비동기 액션이 실패했을 때의 공통 오류 구조.
 * `message`를 사용자에게 표시하거나 로그에 기록할 때 사용한다.
 */
export interface CommonError {
    state?: 'error' | 'fail'
    code?: string
    message?: string
}
