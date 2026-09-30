import type { Rect } from '../engine/sprite-frame-definition'

/**
 * Axis-aligned rectangle overlap. The overlap must exceed `tolerance` pixels on BOTH axes,
 * which forgives pixel-level grazes that would feel unfair to the player.
 */
export function rectsOverlap(a: Rect, b: Rect, tolerance = 0): boolean {
  const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
  const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
  return overlapX > tolerance && overlapY > tolerance
}

/** Translates sprite-relative rects into world space. */
export function offsetRects(rects: readonly Rect[], dx: number, dy: number): Rect[] {
  return rects.map((r) => ({ x: r.x + dx, y: r.y + dy, w: r.w, h: r.h }))
}

export function anyRectsOverlap(a: readonly Rect[], b: readonly Rect[], tolerance = 0): boolean {
  return a.some((ra) => b.some((rb) => rectsOverlap(ra, rb, tolerance)))
}
