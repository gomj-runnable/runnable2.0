import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
    resolve: {
        alias: {
            '~': resolve(__dirname, 'app'),
            '#shared': resolve(__dirname, 'shared')
        }
    },
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./vitest.setup.ts'],
        include: [
            'app/**/__tests__/**/*.test.ts',
            'server/**/__tests__/**/*.test.ts',
            'shared/**/__tests__/**/*.test.ts',
            'layers/**/__tests__/**/*.test.ts'
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'json-summary', 'lcov'],
            reportsDirectory: './coverage',
            include: ['app/**/*.ts', 'server/**/*.ts', 'shared/**/*.ts'],
            // .vue SFC, Cesium 어댑터, 라우팅 셸, 자동생성/타입선언은 측정 제외.
            // epic #267 의 영역별 차등 임계값 정책 참조.
            exclude: [
                '**/__tests__/**',
                '**/*.test.ts',
                '**/*.spec.ts',
                '**/*.d.ts',
                '**/*.vue',
                'app/pages/**',
                'app/plugins/**',
                'app/middleware/**',
                'app/app.config.ts',
                'app/app.vue',
                'app/shared/lib/map/cesium*/**',
                'app/shared/lib/map/**/cesium*.ts',
                'server/data/**',
                'shared/types/**/*.ts'
            ],
            // Phase 0: 임계값 placeholder — 모두 0 으로 비활성. Phase 6 에서 활성화.
            thresholds: {
                lines: 0,
                functions: 0,
                branches: 0,
                statements: 0
            }
        }
    }
})
