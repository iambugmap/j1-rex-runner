import { defineConfig } from 'vitest/config'

// Relative base ('./') lets the same build work on GitHub Pages sub-paths
// (e.g. /j1-rex-runner/) and on any custom domain without extra config.
export default defineConfig({
  base: './',
  build: { target: 'es2022' },
  server: { host: true },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/game/**', 'src/engine/**', 'src/storage/**', 'src/sprites/**'],
      exclude: ['**/*.test.ts', 'src/game/game-scene-renderer.ts', 'src/engine/pixel-sprite-renderer.ts',
        'src/engine/pixel-text-renderer.ts', 'src/engine/canvas-viewport-scaler.ts',
        'src/engine/fixed-timestep-game-loop.ts', 'src/engine/input-controller-keyboard-touch.ts'],
    },
  },
})
