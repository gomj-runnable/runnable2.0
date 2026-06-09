import { getEnvMode, ENVIRONMENT_MODE } from '../config/envMode'
import { assertProductionAuthEnv } from '../security/auth/env'

export default defineNitroPlugin(() => {
    // runtimeConfig 필수 환경 변수 검증 — 미설정(빈 값)이면 부팅 실패
    const config = useRuntimeConfig()
    const requiredEnv: Record<string, string> = {
        WEATHER_KOR: config.weatherKor,
        OPEN_DATA: config.openData,
        AIR_KOREA_KEY: config.airKoreaKey,
        ROUTE_MODE: config.routeMode,
        TMAP_ACCESS_TOCKEN: config.tmapApi
    }
    for (const [name, value] of Object.entries(requiredEnv)) {
        if (!value) throw new Error(`${name} 환경 변수가 설정되지 않았습니다`)
    }

    // 운영 환경 BETTER_AUTH 설정 검증 (secret 길이·https URL)
    const isProduction = getEnvMode() === ENVIRONMENT_MODE.PRODUCT
    if (!isProduction) return
    assertProductionAuthEnv()
})
