import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui'],

  components: false,

  imports: {
    dirs: []
  },

  app: {
    head: {
      viewport: 'width=device-width, initial-scale=1, maximum-scale=1'
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
    airKoreaKey: process.env.OPEN_DATA ?? '',
    routeMode: process.env.ROUTE_MODE ?? 'NONE',
    tmapApi: process.env.TMAP_API ?? '',
    public: {
      routeMode: process.env.ROUTE_MODE ?? 'NONE',
    },
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
    routeRules: {
      '/**': {
        headers: {
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
        }
      }
    },
    publicAssets: [
      { dir: resolve(__dirname, 'lib'), baseURL: '/lib' },
      { dir: resolve(__dirname, 'static'), baseURL: '/static' }
    ]
  }
})
