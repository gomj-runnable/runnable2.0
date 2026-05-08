import pRetry from 'p-retry'

interface ErrorBoundaryOptions<T> {
    /** 로그 식별 라벨 (e.g., 'WeatherSideeffect') */
    label: string
    /** 실패 시 반환할 기본값 */
    fallback?: T
    /** 재시도 횟수 (기본 0) */
    retry?: number
    /** 재시도 간 대기 시간 ms (기본 200) */
    retryDelay?: number
}

/**
 * 비동기 함수에 일관된 에러 경계를 적용하는 데코레이터.
 * sideeffect composable의 반복적인 try/catch 패턴을 통합한다.
 */
export function withErrorBoundary<TArgs extends unknown[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>,
    options: ErrorBoundaryOptions<TReturn>
): (...args: TArgs) => Promise<TReturn> {
    const { label, fallback, retry = 0, retryDelay = 200 } = options

    return async (...args: TArgs): Promise<TReturn> => {
        try {
            return await pRetry(() => fn(...args), {
                retries: retry,
                factor: 2,
                minTimeout: retryDelay,
                onFailedAttempt(error) {
                    console.warn(
                        `[${label}] attempt ${error.attemptNumber}/${retry + 1} failed, retrying...`
                    )
                }
            })
        } catch (err) {
            console.error(`[${label}] failed`, err)

            if (fallback !== undefined) {
                return typeof fallback === 'object' && fallback !== null
                    ? structuredClone(fallback)
                    : fallback
            }

            throw err
        }
    }
}
