import { defineConfig, transformWithEsbuild } from 'vitest/config'

export default defineConfig({
  plugins: [
    {
      name: 'cts-transform',
      async transform(code, id) {
        if (id.endsWith('.cts')) {
          return transformWithEsbuild(code, id, { loader: 'ts' })
        }
      },
    },
  ],
  test: {
    environment: 'node',
    globals: true,
    include: ['scripts/**/*.test.ts'],
    execArgv: ['--require', 'tsx/cjs'],
  },
})
