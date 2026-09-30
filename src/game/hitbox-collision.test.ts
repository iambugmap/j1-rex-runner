import { describe, expect, it } from 'vitest'
import { anyRectsOverlap, offsetRects, rectsOverlap } from './hitbox-collision'

const box = (x: number, y: number, w = 10, h = 10) => ({ x, y, w, h })

describe('rectsOverlap', () => {
  it('detects overlapping rects', () => {
    expect(rectsOverlap(box(0, 0), box(5, 5))).toBe(true)
  })

  it('treats touching edges as no overlap', () => {
    expect(rectsOverlap(box(0, 0), box(10, 0))).toBe(false)
    expect(rectsOverlap(box(0, 0), box(0, 10))).toBe(false)
  })

  it('detects containment', () => {
    expect(rectsOverlap(box(0, 0, 100, 100), box(40, 40, 2, 2))).toBe(true)
  })

  it('forgives overlaps not exceeding the tolerance on either axis', () => {
    expect(rectsOverlap(box(0, 0), box(8, 0), 2)).toBe(false) // 2px horizontal graze
    expect(rectsOverlap(box(0, 0), box(7, 7), 2)).toBe(true) // 3px on both axes
    expect(rectsOverlap(box(0, 0), box(0, 9), 2)).toBe(false) // 1px vertical graze
  })
})

describe('offsetRects', () => {
  it('translates without mutating the input', () => {
    const source = [box(1, 2)]
    const moved = offsetRects(source, 10, 20)
    expect(moved).toEqual([box(11, 22)])
    expect(source).toEqual([box(1, 2)])
  })
})

describe('anyRectsOverlap', () => {
  it('is true when any pair overlaps', () => {
    expect(anyRectsOverlap([box(0, 0), box(100, 100)], [box(105, 105)])).toBe(true)
  })

  it('is false for disjoint sets and empty input', () => {
    expect(anyRectsOverlap([box(0, 0)], [box(50, 50)])).toBe(false)
    expect(anyRectsOverlap([], [box(0, 0)])).toBe(false)
  })
})
