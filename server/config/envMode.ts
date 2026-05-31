// ENVIRONMENT_MODE(DEVELOP/PRODUCT)를 환경 변수에서 읽어 검증하는 설정 모듈

/** 지원하는 실행 환경 모드 (DEVELOP: 개발, PRODUCT: 운영) */
export const ENVIRONMENT_MODE = {
    DEVELOP: 'DEVELOP',
    PRODUCT: 'PRODUCT'
} as const

/** ENVIRONMENT_MODE 값 유니온 타입 ('DEVELOP' | 'PRODUCT') */
export type EnvMode = (typeof ENVIRONMENT_MODE)[keyof typeof ENVIRONMENT_MODE]

/**
 * ENVIRONMENT_MODE 환경 변수를 읽어 EnvMode 로 검증·반환한다.
 * 미설정이거나 허용되지 않은 값이면 throw.
 */
export function getEnvMode(): EnvMode {
    const envMode = process.env.ENVIRONMENT_MODE
    if (envMode === undefined || !Object.values(ENVIRONMENT_MODE).includes(envMode as EnvMode))
        throw new Error(
            `ENVIRONMENT_MODE must be one of [${Object.values(ENVIRONMENT_MODE).join(', ')}], got: ${envMode ?? 'undefined'}`
        )

    return envMode as EnvMode
}
