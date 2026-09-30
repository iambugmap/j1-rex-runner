import { GLYPH_ADVANCE, PIXEL_FONT } from '../sprites/pixel-font-glyphs'
import { drawSprite } from './pixel-sprite-renderer'
import { defineSprite, type SpriteFrame } from './sprite-frame-definition'

/** Renders uppercase text with the 3×5 pixel font at any integer cell size. */

const glyphCache = new Map<string, SpriteFrame>()

function glyph(char: string, pixel: number): SpriteFrame | undefined {
  const rows = PIXEL_FONT[char]
  if (!rows) return undefined
  const key = `${pixel}:${char}`
  let frame = glyphCache.get(key)
  if (!frame) {
    frame = defineSprite(rows, pixel)
    glyphCache.set(key, frame)
  }
  return frame
}

/** Width of rendered text in logical pixels (no trailing spacing). */
export function pixelTextWidth(text: string, pixel: number): number {
  return text.length === 0 ? 0 : text.length * GLYPH_ADVANCE * pixel - pixel
}

export function drawPixelText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  pixel = 2,
): void {
  const upper = text.toUpperCase()
  for (let i = 0; i < upper.length; i++) {
    const frame = glyph(upper[i], pixel)
    if (frame) drawSprite(ctx, frame, x + i * GLYPH_ADVANCE * pixel, y, color)
  }
}

/** Draws text horizontally centered on centerX. */
export function drawCenteredPixelText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  color: string,
  pixel = 2,
): void {
  drawPixelText(ctx, text, Math.round(centerX - pixelTextWidth(text, pixel) / 2), y, color, pixel)
}
