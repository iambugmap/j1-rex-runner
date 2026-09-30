import { describe, expect, it } from 'vitest'
import { OBSTACLE, SPEED, WORLD } from '../config/game-balance-constants'
import { createSeededRandom } from '../engine/seeded-random'
import { computeGap, obstacleFrame, obstacleHitboxes, ObstacleSpawner, type Obstacle } from './obstacle-spawner'

/** Runs the spawner and records every obstacle it creates. */
function collectSpawns(seed: number, steps: number, speedAt: (step: number) => number, scoreAt: (step: number) => number) {
  const spawner = new ObstacleSpawner(createSeededRandom(seed))
  const seen = new Set<Obstacle>()
  const spawned: Array<{ obstacle: Obstacle; speed: number; score: number }> = []
  for (let i = 0; i < steps; i++) {
    const speed = speedAt(i)
    const score = scoreAt(i)
    spawner.update(speed, score)
    for (const obstacle of spawner.items) {
      if (!seen.has(obstacle)) {
        seen.add(obstacle)
        spawned.push({ obstacle, speed, score })
      }
    }
  }
  return { spawner, spawned }
}

describe('computeGap', () => {
  it('stays within [min, 1.5×min] and grows with speed', () => {
    const rng = createSeededRandom(1)
    for (let i = 0; i < 200; i++) {
      const gap = computeGap(24, 6, 120, rng)
      const min = Math.round(24 * 6 + 120 * OBSTACLE.gapCoefficient)
      expect(gap).toBeGreaterThanOrEqual(min)
      expect(gap).toBeLessThanOrEqual(Math.round(min * OBSTACLE.maxGapCoefficient))
    }
    expect(computeGap(24, 13, 120, () => 0)).toBeGreaterThan(computeGap(24, 6, 120, () => 0))
  })
})

describe('ObstacleSpawner', () => {
  it('waits for the warm-up period before the first obstacle', () => {
    const spawner = new ObstacleSpawner(createSeededRandom(3))
    for (let i = 0; i < OBSTACLE.warmupSteps; i++) spawner.update(SPEED.start, 0)
    expect(spawner.items).toHaveLength(0)
    spawner.update(SPEED.start, 0)
    expect(spawner.items).toHaveLength(1)
    expect(spawner.items[0].x).toBe(WORLD.width)
  })

  it('never spawns pterodactyls below the minimum score', () => {
    const { spawned } = collectSpawns(7, 20_000, () => 9, () => OBSTACLE.pteroMinScore - 1)
    expect(spawned.length).toBeGreaterThan(20)
    expect(spawned.some((s) => s.obstacle.kind === 'ptero')).toBe(false)
  })

  it('spawns pterodactyls at the three configured heights once allowed', () => {
    const { spawned } = collectSpawns(11, 60_000, () => 10, () => 1000)
    const lifts = new Set(
      spawned
        .filter((s) => s.obstacle.kind === 'ptero')
        .map((s) => WORLD.groundY - s.obstacle.y - obstacleFrame(s.obstacle).height),
    )
    expect([...lifts].sort((a, b) => a - b)).toEqual([...OBSTACLE.pteroLifts].sort((a, b) => a - b))
  })

  it('only groups cacti above their speed thresholds', () => {
    const slow = collectSpawns(5, 20_000, () => 3.5, () => 0).spawned
    expect(slow.every((s) => s.obstacle.count === 1)).toBe(true)
    const fast = collectSpawns(5, 20_000, () => 12, () => 0).spawned
    expect(fast.some((s) => s.obstacle.count > 1)).toBe(true)
    expect(fast.every((s) => s.obstacle.count <= 3)).toBe(true)
  })

  it('never repeats the same kind more than maxDuplication times in a row', () => {
    const { spawned } = collectSpawns(21, 60_000, () => 10, () => 1000)
    let run = 1
    for (let i = 1; i < spawned.length; i++) {
      run = spawned[i].obstacle.kind === spawned[i - 1].obstacle.kind ? run + 1 : 1
      expect(run).toBeLessThanOrEqual(OBSTACLE.maxDuplication)
    }
  })

  it('keeps every gap at least the fair minimum for the speed at spawn time', () => {
    const { spawned } = collectSpawns(9, 30_000, (i) => Math.min(SPEED.max, SPEED.start + i * 0.001), () => 1000)
    for (const { obstacle, speed } of spawned) {
      const minGap = obstacle.kind === 'ptero' ? 150 : 120
      expect(obstacle.gapAfter).toBeGreaterThanOrEqual(Math.round(obstacle.width * speed + minGap * OBSTACLE.gapCoefficient))
    }
  })

  it('moves obstacles left, removes them offscreen and resets cleanly', () => {
    const spawner = new ObstacleSpawner(createSeededRandom(2))
    for (let i = 0; i <= OBSTACLE.warmupSteps; i++) spawner.update(SPEED.start, 0)
    const first = spawner.items[0]
    spawner.update(SPEED.start, 0)
    expect(first.x).toBe(WORLD.width - SPEED.start)
    for (let i = 0; i < 400; i++) spawner.update(SPEED.start, 0)
    expect(spawner.items).not.toContain(first)
    spawner.reset()
    expect(spawner.items).toHaveLength(0)
  })

  it('collides only when hitboxes actually overlap', () => {
    const spawner = new ObstacleSpawner(createSeededRandom(4))
    for (let i = 0; i <= OBSTACLE.warmupSteps; i++) spawner.update(SPEED.start, 0)
    const obstacle = spawner.items[0]
    const [firstBox] = obstacleHitboxes(obstacle)
    const hit = { x: firstBox.x, y: firstBox.y, w: 10, h: 10 }
    expect(spawner.collidesWith(hit, [hit])).toBe(true)
    const miss = { x: 0, y: 0, w: 10, h: 10 }
    expect(spawner.collidesWith(miss, [miss])).toBe(false)
  })
})
