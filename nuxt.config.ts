// Nuxt 애플리케이션 전역 설정 (모듈·런타임 설정·Nitro 서버·보안 헤더 등)
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
    // SPA 모드 — 서버사이드 렌더링 비활성 (클라이언트에서만 렌더)
    ssr: false,

    // 사용할 Nuxt 모듈: API 레이트리밋 / ESLint / UI 컴포넌트
    modules: ['nuxt-api-shield', '@nuxt/eslint', '@nuxt/ui'],

    // nuxt-api-shield: API 요청 레이트리밋 설정
    nuxtApiShield: {
        // 전역 기본 한도 — 60초당 60회 초과 시 3600초(1시간) 차단
        limit: {
            max: 60,
            duration: 60,
            ban: 3600
        },
        // 429 응답에 Retry-After 헤더 포함
        retryAfterHeader: true,
        // 경로별 개별 한도 (인증 / 경로 최적화 / 주변 시설 조회)
        routes: [
            { path: '/api/auth', max: 10, duration: 60 },
            { path: '/api/routes/optimize', max: 10, duration: 60 },
            { path: '/api/facilities/nearby', max: 30, duration: 60 }
        ]
    },

    // 컴포넌트 자동 등록 비활성 — 명시적 import 강제
    components: false,

    // 컴포저블 자동 import 비활성 — 명시적 import 강제
    imports: {
        dirs: []
    },

    // 문서 <head> 기본값 — 반응형 뷰포트
    app: {
        head: {
            viewport: 'width=device-width, initial-scale=1'
        }
    },

    // Nuxt DevTools 비활성
    devtools: {
        enabled: false
    },

    // 전역 CSS 엔트리
    css: ['~/assets/css/base/main.css'],

    // Nuxt 기능 호환성 기준일
    compatibilityDate: '2025-01-15',

    // 런타임 설정 — 외부 API 키·기능 플래그 (NUXT_ 접두어 환경 변수로 오버라이드)
    runtimeConfig: {
        weatherKor: process.env.WEATHER_KOR ?? '', // 기상청 단기예보 키 (서버 전용)
        openData: process.env.OPEN_DATA ?? '', // 공공데이터포털 키 (서버 전용)
        airKoreaKey: process.env.AIR_KOREA_KEY ?? '', // 에어코리아 대기질 키 (서버 전용)
        routeMode: process.env.ROUTE_MODE ?? '', // 경로 엔진 모드 (서버 전용, 부팅 시 필수 검증)
        tmapApi: process.env.TMAP_API ?? '', // T맵 경로 API 키 (서버 전용)
        // 클라이언트(브라우저)에 노출되는 값
        public: {
            routeMode: process.env.ROUTE_MODE ?? '', // 경로 엔진 모드 (클라이언트 표시용)
            // V-World WMTS 키. 브라우저가 직접 타일을 호출하므로 public 노출 (도메인 화이트리스트 기반)
            vworldKey: process.env.V_WORLD ?? ''
        }
    },

    // Vite 빌드 설정
    vite: {
        // Tailwind CSS v4 Vite 플러그인
        plugins: [tailwindcss()],
        // @nuxt/ui 가 쓰는 prosemirror 의존성 사전 번들링 (dev 최적화)
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

    // ESLint — 스타일(포맷) 규칙 비활성, 코드 품질 규칙만 사용
    eslint: {
        config: {
            stylistic: false
        }
    },

    // 라우트별 렌더링 규칙 — 루트는 SSR 비활성(SPA)
    routeRules: {
        '/': { ssr: false }
    },

    // Nitro 서버 엔진 설정
    nitro: {
        // 서버 자산 — 시설물 정적 데이터 디렉터리 등록
        serverAssets: [{ baseName: 'facilities', dir: './server/data/facilities' }],
        // 전역 보안 응답 헤더 + CSP (모든 경로에 적용)
        routeRules: {
            '/**': {
                headers: {
                    'X-Frame-Options': 'DENY', // 클릭재킹 방지 (iframe 임베드 차단)
                    'X-Content-Type-Options': 'nosniff', // MIME 타입 스니핑 차단
                    'Referrer-Policy': 'strict-origin-when-cross-origin', // 리퍼러 노출 최소화
                    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)', // 브라우저 권한 최소화 (위치만 자기 출처 허용)
                    // 콘텐츠 보안 정책 — 리소스 출처 화이트리스트 (Cesium·지도 타일·CDN 등)
                    'Content-Security-Policy': [
                        "default-src 'self'",
                        "img-src 'self' data: blob: https:",
                        "connect-src 'self' https://*.cesium.com https://assets.ion.cesium.com https://mapprime.synology.me:15289 https://server.arcgisonline.com https://api.vworld.kr https://cdn.jsdelivr.net https://api.iconify.design",
                        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
                        "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob:",
                        "worker-src 'self' blob:",
                        "font-src 'self' data: https://cdn.jsdelivr.net",
                        "frame-ancestors 'none'"
                    ].join('; '),
                    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' // HTTPS 강제 (1년)
                }
            }
        },
        // 정적 파일 public 마운트 — /lib, /static
        publicAssets: [
            { dir: resolve(__dirname, 'lib'), baseURL: '/lib' },
            { dir: resolve(__dirname, 'static'), baseURL: '/static' }
        ]
    }
})
