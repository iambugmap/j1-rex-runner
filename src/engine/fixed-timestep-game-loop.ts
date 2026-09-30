/**
 * requestAnimationFrame loop with a fixed 60Hz simulation step. Game speed is therefore
 * identical on 60Hz, 90Hz and 120Hz displays; rendering happens once per animation frame.
 */

export const STEP_MS = 1000 / 60
/** Ignore huge gaps (tab was hidden) instead of fast-forwarding the simulation. */
const MAX_FRAME_MS = 250
const MAX_STEPS_PER_FRAME = 5

export interface GameLoop {
  start(): void
  stop(): void
}

export function createGameLoop(update: () => void, render: () => void): GameLoop {
  let running = false
  let rafId = 0
  let lastTime = 0
  let accumulator = 0

  const frame = (now: number): void => {
    if (!running) return
    // rAF timestamps can precede the performance.now() taken in start(): clamp to >= 0.
    accumulator += Math.min(MAX_FRAME_MS, Math.max(0, now - lastTime))
    lastTime = now

    let steps = 0
    while (accumulator >= STEP_MS && steps < MAX_STEPS_PER_FRAME) {
      update()
      accumulator -= STEP_MS
      steps++
    }
    // Still behind after the cap (very slow device): drop the backlog to avoid a spiral.
    if (steps === MAX_STEPS_PER_FRAME) accumulator = 0

    render()
    rafId = requestAnimationFrame(frame)
  }

  return {
    start() {
      if (running) return
      running = true
      lastTime = performance.now()
      accumulator = 0
      rafId = requestAnimationFrame(frame)
    },
    stop() {
      running = false
      cancelAnimationFrame(rafId)
    },
  }
}
