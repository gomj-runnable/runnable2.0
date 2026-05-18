export default defineNitroPlugin(() => {
    const isProduction = process.env.NODE_ENV === 'production'
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
