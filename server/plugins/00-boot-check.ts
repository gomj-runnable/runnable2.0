import { getEnvMode, ENVIRONMENT_MODE } from '../config/envMode'

export default defineNitroPlugin(() => {
    const isProduction = getEnvMode() === ENVIRONMENT_MODE.PRODUCT
    if (!isProduction) return

    const secret = process.env.BETTER_AUTH_SECRET
    if (!secret || secret.length < 32) {
        throw new Error('BETTER_AUTH_SECRET must be set and >= 32 chars in production')
    }

    const url = process.env.BETTER_AUTH_URL
    if (!url?.startsWith('https://')) {
        throw new Error('BETTER_AUTH_URL must be https:// in production')
    }
})
