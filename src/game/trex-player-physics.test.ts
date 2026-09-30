import { describe, expect, it } from 'vitest'
import { TREX, WORLD } from '../config/game-balance-constants'
import { TREX_DUCK_FRAMES, TREX_STANDING } from '../sprites/trex-sprite-frames'
import { TrexPlayer } from './trex-player-physics'

/** Steps until landing, returning peak height and airtime. */
function simulateJump(player: TrexPlayer, releaseAtStep = Infinity) {
  let peak = 0
  let steps = 0
  while (player.isAirborne && steps < 500) {
    if (steps === releaseAtStep) player.releaseJump()
    player.step()
    peak = Math.max(peak, player.height)
    steps++
  }
  return { peak, steps }
}

describe('TrexPlayer', () => {
  it('starts idle on the ground', () => {
    const player = new TrexPlayer()
    expect(player.pose).toBe('idle')
    expect(player.height).toBe(0)
    expect(player.y).toBe(WORLD.groundY - TREX_STANDING.height)
  })

  it('runs and animates legs after startRunning', () => {
    const player = new TrexPlayer()
    player.startRunning()
    const first = player.frame
    for (let i = 0; i < TREX.runFrameSteps; i++) player.step()
    expect(player.pose).toBe('run')
    expect(player.frame).not.toBe(first)
  })

  it('a held jump peaks higher than a tapped jump and both land', () => {
    const holdPlayer = new TrexPlayer()
    holdPlayer.pressJump()
    const full = simulateJump(holdPlayer)

    const tapPlayer = new TrexPlayer()
    tapPlayer.pressJump()
    const tap = simulateJump(tapPlayer, 0)

    expect(full.peak).toBeGreaterThan(tap.peak)
    expect(tap.peak).toBeGreaterThanOrEqual(TREX.minJumpHeight)
    // Peak must stay inside the canvas so the T-rex never leaves the screen.
    expect(full.peak + TREX_STANDING.height).toBeLessThanOrEqual(WORLD.groundY)
    expect(holdPlayer.isAirborne).toBe(false)
    expect(holdPlayer.height).toBe(0)
  })

  it('a full jump clears the tallest cactus for long enough to pass a group', () => {
    const player = new TrexPlayer()
    player.pressJump()
    let stepsAbove48 = 0
    while (player.isAirborne) {
      player.step()
      if (player.height > 48) stepsAbove48++
    }
    // At start speed 6 this is > 72px (3-cactus group) + T-rex foot span.
    expect(stepsAbove48 * 6).toBeGreaterThan(100)
  })

  it('cannot double jump', () => {
    const player = new TrexPlayer()
    expect(player.pressJump()).toBe(true)
    player.step()
    expect(player.pressJump()).toBe(false)
  })

  it('ducking mid-air makes it fall faster', () => {
    const normal = new TrexPlayer()
    normal.pressJump()
    const normalRun = simulateJump(normal)

    const dropper = new TrexPlayer()
    dropper.pressJump()
    for (let i = 0; i < 5; i++) dropper.step()
    dropper.pressDuck()
    const dropRun = simulateJump(dropper)
    expect(dropRun.steps + 5).toBeLessThan(normalRun.steps)
  })

  it('ducks on the ground only while running, with a shorter frame', () => {
    const player = new TrexPlayer()
    player.pressDuck()
    expect(player.pose).toBe('idle')
    player.startRunning()
    expect(player.pose).toBe('duck')
    expect(TREX_DUCK_FRAMES).toContain(player.frame)
    player.releaseDuck()
    expect(player.pose).toBe('run')
  })

  it('freezes on crash and ignores jumps until reset', () => {
    const player = new TrexPlayer()
    player.startRunning()
    player.crash()
    expect(player.pose).toBe('crash')
    expect(player.pressJump()).toBe(false)
    player.step()
    expect(player.height).toBe(0)
    player.reset()
    expect(player.pose).toBe('idle')
    expect(player.pressJump()).toBe(true)
  })

  it('exposes world-space hitboxes inside its bounds', () => {
    const player = new TrexPlayer()
    const bounds = player.bounds()
    for (const box of player.hitboxes()) {
      expect(box.x).toBeGreaterThanOrEqual(bounds.x)
      expect(box.y).toBeGreaterThanOrEqual(bounds.y)
      expect(box.x + box.w).toBeLessThanOrEqual(bounds.x + bounds.w)
      expect(box.y + box.h).toBeLessThanOrEqual(bounds.y + bounds.h)
    }
  })
})
