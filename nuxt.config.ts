import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
    ssr: false,

    modules: ['nuxt-api-shield', '@nuxt/eslint', '@nuxt/ui'],

    nuxtApiShield: {
        limit: {
            max: 60,
            duration: 60,
            ban: 3600
        },
        retryAfterHeader: true,
        routes: [
            { path: '/api/auth', max: 10, duration: 60 },
            { path: '/api/weather', max: 30, duration: 60 },
            { path: '/api/routes/optimize', max: 10, duration: 60 },
            { path: '/api/facilities/nearby', max: 30, duration: 60 },
            { path: '/api/admin', max: 10, duration: 60 },
            { path: '/api/uml', max: 5, duration: 60 }
        ]
    },

    components: false,

    imports: {
        dirs: []
    },

    app: {
        head: {
            viewport: 'width=device-width, initial-scale=1'
        }
    },

    devtools: {
        enabled: false
    },

    css: ['~/assets/css/base/main.css'],

    compatibilityDate: '2025-01-15',

    runtimeConfig: {
        weatherKor: process.env.WEATHER_KOR ?? '',
        openData: process.env.OPEN_DATA ?? '',
        airKoreaKey: process.env.AIR_KOREA_KEY ?? '',
        routeMode: process.env.ROUTE_MODE ?? 'NONE',
        tmapApi: process.env.TMAP_API ?? '',
        public: {
            routeMode: process.env.ROUTE_MODE ?? 'NONE'
        }
    },

    vite: {
        plugins: [tailwindcss()],
        optimizeDeps: {
            include: [
                '@nuxt/ui > prosemirror-state',
                '@nuxt/ui > prosemirror-transform',
                '@nuxt/ui > prosemirror-model',
                '@nuxt/ui > prosemirror-view',
                '@nuxt/ui > prosemirror-gapcursor'
            ]
        }
    },

    eslint: {
        config: {
            stylistic: false
        }
    },

    routeRules: {
        '/': { ssr: false }
    },

    nitro: {
        serverAssets: [{ baseName: 'facilities', dir: './server/data/facilities' }],
        routeRules: {
            '/**': {
                headers: {
                    'X-Frame-Options': 'DENY',
                    'X-Content-Type-Options': 'nosniff',
                    'Referrer-Policy': 'strict-origin-when-cross-origin',
                    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
                    'Content-Security-Policy': [
                        "default-src 'self'",
                        "img-src 'self' data: blob: https:",
                        "connect-src 'self' https://*.cesium.com https://assets.ion.cesium.com https://mapprime.synology.me:15289 https://server.arcgisonline.com https://cdn.jsdelivr.net https://api.iconify.design",
                        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
                        "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob:",
                        "worker-src 'self' blob:",
                        "font-src 'self' data: https://cdn.jsdelivr.net",
                        "frame-ancestors 'none'"
                    ].join('; '),
                    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
                }
            }
        },
        publicAssets: [
            { dir: resolve(__dirname, 'lib'), baseURL: '/lib' },
            { dir: resolve(__dirname, 'static'), baseURL: '/static' }
        ]
    }
})
