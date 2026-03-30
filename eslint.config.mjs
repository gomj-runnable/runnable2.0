import withNuxt from './.nuxt/eslint.config.mjs'
import prettierConfig from 'eslint-config-prettier'

export default withNuxt(prettierConfig, {
  plugins: {
    prettier: (await import('eslint-plugin-prettier')).default
  },
  rules: {
    'prettier/prettier': 'error',
    'no-unused-vars': 'warn',
    'vue/multi-word-component-names': 'off'
  }
})
