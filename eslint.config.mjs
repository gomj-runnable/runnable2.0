import withNuxt from './.nuxt/eslint.config.mjs'
import prettierConfig from 'eslint-config-prettier'

const noUpwardLayer = (msg, patterns) => ({
    'no-restricted-imports': [
        'error',
        {
            patterns: patterns.map((group) => ({
                group: [group],
                message: msg
            }))
        }
    ]
})

export default withNuxt(
    prettierConfig,
    {
        plugins: {
            prettier: (await import('eslint-plugin-prettier')).default
        },
        rules: {
            'prettier/prettier': 'error',
            'no-unused-vars': 'warn',
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn',
            'vue/multi-word-component-names': 'off'
        }
    },
    // ─── FSD 경계 보호 ────────────────────────────────────────────
    // pages > widgets > features > entities > shared (단방향)
    {
        files: ['app/shared/**/*.{ts,vue}'],
        rules: noUpwardLayer(
            'shared 레이어는 상위 레이어(entities/features/widgets/pages)를 import할 수 없습니다.',
            ['~/entities/**', '~/features/**', '~/widgets/**', '~/pages/**']
        )
    },
    {
        files: ['app/entities/**/*.{ts,vue}'],
        rules: noUpwardLayer(
            'entities 레이어는 상위 레이어(features/widgets/pages)를 import할 수 없습니다.',
            ['~/features/**', '~/widgets/**', '~/pages/**']
        )
    },
    {
        files: ['app/features/**/*.{ts,vue}'],
        rules: noUpwardLayer(
            'features 레이어는 상위 레이어(widgets/pages)를 import할 수 없습니다.',
            ['~/widgets/**', '~/pages/**']
        )
    },
    {
        files: ['app/widgets/**/*.{ts,vue}'],
        rules: noUpwardLayer('widgets 레이어는 상위 레이어(pages)를 import할 수 없습니다.', [
            '~/pages/**'
        ])
    }
)
