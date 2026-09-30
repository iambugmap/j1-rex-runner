import { WORLD } from '../config/game-balance-constants'
import { drawSprite } from '../engine/pixel-sprite-renderer'
import { drawCenteredPixelText, drawPixelText, pixelTextWidth } from '../engine/pixel-text-renderer'
import { CLOUD, MOUNTAIN, RESTART_ICON } from '../sprites/background-scenery-sprites'
import type { GameSession } from './game-state-machine'
import { obstacleFrame } from './obstacle-spawner'
import type { Palette } from './palette-colors'

/** Draws one frame of the game from the session state. Read-only: never mutates the session. */

const HUD_PIXEL = 2
const HUD_TOP = 8
const HUD_RIGHT = WORLD.width - 10
const GROUND_LINE_HEIGHT = 2

const pad5 = (value: number): string => String(Math.min(99999, value)).padStart(5, '0')

function drawBackground(ctx: CanvasRenderingContext2D, session: GameSession, palette: Palette): void {
  ctx.fillStyle = palette.paper
  ctx.fillRect(0, 0, WORLD.width, WORLD.height)

  for (const mountain of session.scenery.mountains) drawSprite(ctx, MOUNTAIN, mountain.x, mountain.y, palette.faint)
  for (const cloud of session.scenery.clouds) drawSprite(ctx, CLOUD, cloud.x, cloud.y, palette.faint)

  ctx.fillStyle = palette.ink
  ctx.fillRect(0, WORLD.groundY - 1, WORLD.width, GROUND_LINE_HEIGHT)
  for (const pebble of session.scenery.pebbles) {
    ctx.fillRect(Math.round(pebble.x), pebble.y, pebble.size + 1, pebble.size)
  }
}

function drawActors(ctx: CanvasRenderingContext2D, session: GameSession, palette: Palette): void {
  for (const obstacle of session.obstacles.items) {
    const frame = obstacleFrame(obstacle)
    for (let i = 0; i < obstacle.count; i++) {
      drawSprite(ctx, frame, obstacle.x + i * frame.width, obstacle.y, palette.ink)
    }
  }
  const player = session.player
  drawSprite(ctx, player.frame, player.x, player.y, palette.ink)
}

function drawHud(ctx: CanvasRenderingContext2D, session: GameSession, palette: Palette): void {
  const { score } = session
  // Blink the current score for a moment after each milestone, like Chrome.
  const hideScore = score.isFlashing && Math.floor(score.flashStepsRemaining / 8) % 2 === 0
  const current = hideScore ? '     ' : pad5(score.score)
  const text = score.highScore > 0 ? `HI ${pad5(score.highScore)}  ${current}` : current
  drawPixelText(ctx, text, HUD_RIGHT - pixelTextWidth(text, HUD_PIXEL), HUD_TOP, palette.ink, HUD_PIXEL)
}

function drawOverlay(ctx: CanvasRenderingContext2D, session: GameSession, palette: Palette): void {
  const centerX = WORLD.width / 2
  switch (session.phase) {
    case 'ready':
      // Gentle blink so the prompt draws the eye.
      if (Math.floor(session.phaseSteps / 30) % 2 === 0) {
        drawCenteredPixelText(ctx, 'TAP TO START', centerX, 56, palette.ink, 3)
      }
      break
    case 'paused':
      drawCenteredPixelText(ctx, 'PAUSED', centerX, 44, palette.ink, 3)
      drawCenteredPixelText(ctx, 'TAP TO RESUME', centerX, 72, palette.ink, 2)
      break
    case 'resuming':
      drawCenteredPixelText(ctx, String(session.resumeCountdown), centerX, 44, palette.ink, 5)
      break
    case 'crashed':
      drawCenteredPixelText(ctx, 'GAME OVER', centerX, 40, palette.ink, 3)
      if (session.canRestart) {
        drawSprite(ctx, RESTART_ICON, centerX - RESTART_ICON.width / 2, 68, palette.ink)
      }
      break
    case 'running':
      break
  }
}

/**
 * Renders the full scene. `scale` maps logical pixels to canvas pixels; smoothing is disabled
 * so the pixel art stays crisp at any scale.
 */
export function renderScene(ctx: CanvasRenderingContext2D, scale: number, session: GameSession): void {
  const palette = session.dayNight.palette()
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  ctx.imageSmoothingEnabled = false
  drawBackground(ctx, session, palette)
  drawActors(ctx, session, palette)
  drawHud(ctx, session, palette)
  drawOverlay(ctx, session, palette)
}
