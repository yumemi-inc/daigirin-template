import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'

export default [
  {
    ...js.configs.recommended,
    ignores: [
      '.eslintrc.js',
      '.prettierrc.js',
      '**/*.config.js',
      'jest/*',
      '**/.vivliostyle/*',
      'prh-rules/*',
      '.yarn/*',
    ],
    files: ['**/*.{js,mjs,ts}'],
    ...eslintConfigPrettier, // 一番最後に書く
  },
]
