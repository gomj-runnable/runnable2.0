import { getEnvMode, ENVIRONMENT_MODE } from '../config/envMode'
import { assertProductionAuthEnv } from '../config/authEnv'

export default defineNitroPlugin(() => {
    const isProduction = getEnvMode() === ENVIRONMENT_MODE.PRODUCT
    if (!isProduction) return

    // 운영 환경 BETTER_AUTH 설정 검증 (secret 길이·https URL)
    assertProductionAuthEnv()
})
