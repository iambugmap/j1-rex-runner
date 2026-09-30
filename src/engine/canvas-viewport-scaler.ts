import { WORLD } from '../config/game-balance-constants'

/**
 * Sizes the canvas backing store to the container width × devicePixelRatio while keeping the
 * logical WORLD aspect ratio. Returns the logical→canvas scale factor for ctx.setTransform.
 */
export function fitCanvasToContainer(canvas: HTMLCanvasElement, container: HTMLElement): number {
  const dpr = window.devicePixelRatio || 1
  const cssWidth = Math.max(1, container.clientWidth)
  const scale = (cssWidth * dpr) / WORLD.width

  const width = Math.round(WORLD.width * scale)
  const height = Math.round(WORLD.height * scale)
  // Assigning width/height clears and reallocates the canvas, so skip no-op resizes.
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }
  canvas.style.height = `${(cssWidth * WORLD.height) / WORLD.width}px`
  return scale
}
