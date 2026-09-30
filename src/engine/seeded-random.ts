/** Deterministic PRNG so gameplay logic is reproducible in tests. */

export type RandomFn = () => number

/** mulberry32: small, fast, good-enough distribution for game randomness. Returns [0, 1). */
export function createSeededRandom(seed: number): RandomFn {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Inclusive integer in [min, max]. */
export function randomInt(rng: RandomFn, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1))
}

export function randomPick<T>(rng: RandomFn, items: readonly T[]): T {
  if (items.length === 0) throw new Error('randomPick requires a non-empty list')
  return items[Math.floor(rng() * items.length)]
}
