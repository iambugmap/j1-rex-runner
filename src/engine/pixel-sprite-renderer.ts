import { INK, type SpriteFrame } from './sprite-frame-definition'

/**
 * Draws sprite matrices onto a canvas. Each (frame, color) pair is rasterized once into an
 * offscreen canvas at logical resolution and then blitted with nearest-neighbour scaling,
 * so per-frame rendering is a single drawImage call per sprite.
 */

const cache = new WeakMap<SpriteFrame, Map<string, HTMLCanvasElement>>()

function rasterize(frame: SpriteFrame, color: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = frame.width
  canvas.height = frame.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas context unavailable')

  ctx.fillStyle = color
  frame.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === INK) ctx.fillRect(x * frame.pixel, y * frame.pixel, frame.pixel, frame.pixel)
    }
  })
  return canvas
}

function getRasterized(frame: SpriteFrame, color: string): HTMLCanvasElement {
  let byColor = cache.get(frame)
  if (!byColor) {
    byColor = new Map()
    cache.set(frame, byColor)
  }
  let image = byColor.get(color)
  if (!image) {
    image = rasterize(frame, color)
    byColor.set(color, image)
  }
  return image
}

/** Draws a sprite with its top-left corner at (x, y) in logical pixels. */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  frame: SpriteFrame,
  x: number,
  y: number,
  color: string,
): void {
  ctx.drawImage(getRasterized(frame, color), Math.round(x), Math.round(y))
}
