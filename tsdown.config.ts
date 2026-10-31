import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/cli.ts'],
  format: 'esm',
  platform: 'node',
  target: 'node18',
  clean: true,
  dts: false,
  outDir: 'cli-dist',
  deps: {
    skipNodeModulesBundle: true,
  },
})
