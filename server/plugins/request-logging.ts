import { randomUUID } from 'node:crypto'
import pino from 'pino'

const isDev = process.env.NODE_ENV !== 'production'

const log = pino({
    level: process.env.LOG_LEVEL ?? 'info',
    redact: {
        paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            '*.password',
            '*.token',
            '*.secret',
            '*.serviceKey',
            '*.authKey',
            '*.appKey'
        ],
        remove: true
    },
    ...(isDev
        ? { transport: { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss' } } }
        : {})
})

const SKIP_PREFIXES = ['/_nuxt/', '/__nuxt/', '/_ipx/']
const AUTH_PREFIX = '/api/auth/'

function shouldSkip(path: string): boolean {
    return SKIP_PREFIXES.some((p) => path.startsWith(p))
}

declare module 'h3' {
    interface H3EventContext {
        reqId?: string
        startTime?: number
    }
}

export default defineNitroPlugin((nitroApp) => {
    nitroApp.hooks.hook('request', (event) => {
        if (shouldSkip(event.path)) return
        event.context.reqId = randomUUID()
        event.context.startTime = Date.now()
    })

    nitroApp.hooks.hook('afterResponse', (event) => {
        const startTime = event.context.startTime
        if (startTime === undefined) return

        const durationMs = Date.now() - startTime
        const status = event.node.res.statusCode
        const reqId = event.context.reqId
        const isAuth = event.path.startsWith(AUTH_PREFIX)
        const userId = isAuth ? undefined : (event.context.user?.userId ?? 'guest')

        log.info(
            {
                method: event.method,
                path: event.path,
                status,
                durationMs,
                reqId,
                ...(userId ? { userId } : {})
            },
            isAuth ? 'auth request' : 'request'
        )
    })
})
