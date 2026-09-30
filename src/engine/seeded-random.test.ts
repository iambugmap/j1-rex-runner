import { describe, expect, it } from 'vitest'
import { createSeededRandom, randomInt, randomPick } from './seeded-random'

describe('createSeededRandom', () => {
  it('produces deterministic sequence from same seed', () => {
    const rng1 = createSeededRandom(42)
    const rng2 = createSeededRandom(42)
    const seq1 = Array.from({ length: 10 }, () => rng1())
    const seq2 = Array.from({ length: 10 }, () => rng2())
    expect(seq1).toEqual(seq2)
  })

  it('produces different sequences from different seeds', () => {
    const rng1 = createSeededRandom(1)
    const rng2 = createSeededRandom(2)
    const seq1 = Array.from({ length: 10 }, () => rng1())
    const seq2 = Array.from({ length: 10 }, () => rng2())
    expect(seq1).not.toEqual(seq2)
  })

  it('always returns values in [0, 1)', () => {
    const rng = createSeededRandom(999)
    for (let i = 0; i < 1000; i++) {
      const value = rng()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
})

describe('randomInt', () => {
  it('returns integer within [min, max] inclusive', () => {
    const rng = createSeededRandom(42)
    for (let i = 0; i < 100; i++) {
      const value = randomInt(rng, 10, 20)
      expect(value).toBeGreaterThanOrEqual(10)
      expect(value).toBeLessThanOrEqual(20)
      expect(Number.isInteger(value)).toBe(true)
    }
  })

  it('can return both min and max values', () => {
    const rng = createSeededRandom(42)
    const values = new Set<number>()
    for (let i = 0; i < 1000; i++) {
      values.add(randomInt(rng, 5, 7))
    }
    // Should eventually see 5, 6, and 7 (with extremely high probability)
    expect(values.has(5)).toBe(true)
    expect(values.has(7)).toBe(true)
  })

  it('works with single value range (min === max)', () => {
    const rng = createSeededRandom(42)
    for (let i = 0; i < 10; i++) {
      expect(randomInt(rng, 8, 8)).toBe(8)
    }
  })

  it('works with negative ranges', () => {
    const rng = createSeededRandom(42)
    for (let i = 0; i < 50; i++) {
      const value = randomInt(rng, -10, 10)
      expect(value).toBeGreaterThanOrEqual(-10)
      expect(value).toBeLessThanOrEqual(10)
    }
  })
})

describe('randomPick', () => {
  it('returns an element from the list', () => {
    const items = ['a', 'b', 'c', 'd', 'e']
    const rng = createSeededRandom(42)
    for (let i = 0; i < 50; i++) {
      const picked = randomPick(rng, items)
      expect(items).toContain(picked)
    }
  })

  it('can pick any element (high probability)', () => {
    const items = ['x', 'y', 'z']
    const rng = createSeededRandom(42)
    const picked = new Set<string>()
    for (let i = 0; i < 1000; i++) {
      picked.add(randomPick(rng, items))
    }
    expect(picked.has('x')).toBe(true)
    expect(picked.has('y')).toBe(true)
    expect(picked.has('z')).toBe(true)
  })

  it('works with single-element list', () => {
    const rng = createSeededRandom(42)
    expect(randomPick(rng, [42])).toBe(42)
  })

  it('throws on empty list', () => {
    const rng = createSeededRandom(42)
    expect(() => randomPick(rng, [])).toThrow(/non-empty/)
  })
})
