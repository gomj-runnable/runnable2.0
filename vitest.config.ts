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
        ]
    }
})
