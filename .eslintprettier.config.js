import prettierPlugin from 'eslint-plugin-prettier'
import eslintConfig from './eslint.config.mjs'

export default [
  ...eslintConfig,
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
]
