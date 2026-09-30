import { describe, expect, it } from 'vitest'
import { SCORE } from '../config/game-balance-constants'
import { DayNightCycle, isNightScore } from './day-night-cycle'
import { DistanceScoreTracker } from './distance-score-tracker'
import { DAY_PALETTE, mixHex, NIGHT_PALETTE } from './palette-colors'

describe('DistanceScoreTracker', () => {
  it('scores distance × coefficient, floored', () => {
    const tracker = new DistanceScoreTracker()
    for (let i = 0; i < 10; i++) tracker.advance(6)
    expect(tracker.score).toBe(Math.floor(60 * SCORE.coefficient))
  })

  it('ignores negative speed', () => {
    const tracker = new DistanceScoreTracker()
    tracker.advance(-100)
    expect(tracker.score).toBe(0)
  })

  it('reports each milestone exactly once and flashes afterwards', () => {
    const tracker = new DistanceScoreTracker()
    let milestones = 0
    // 1 step = 10 distance = 0.25 pts → 100 pts after 400 steps
    for (let i = 0; i < 1200; i++) if (tracker.advance(10)) milestones++
    expect(tracker.score).toBe(300)
    expect(milestones).toBe(3)
    expect(tracker.isFlashing).toBe(true)
    for (let i = 0; i < SCORE.flashSteps; i++) tracker.advance(0)
    expect(tracker.isFlashing).toBe(false)
  })

  it('commits a record only when beaten and keeps it across reset', () => {
    const tracker = new DistanceScoreTracker()
    tracker.setHighScore(5)
    tracker.advance(100) // 2 pts
    expect(tracker.commitHighScore()).toBe(false)
    tracker.advance(400) // 12 pts total
    expect(tracker.commitHighScore()).toBe(true)
    expect(tracker.highScore).toBe(12)
    tracker.reset()
    expect(tracker.score).toBe(0)
    expect(tracker.highScore).toBe(12)
  })

  it('rejects non-finite stored high scores', () => {
    const tracker = new DistanceScoreTracker()
    tracker.setHighScore(Number.NaN)
    tracker.setHighScore(Number.POSITIVE_INFINITY)
    expect(tracker.highScore).toBe(0)
  })
})

describe('day/night cycle', () => {
  it('is night during odd 700-point blocks', () => {
    expect(isNightScore(0)).toBe(false)
    expect(isNightScore(699)).toBe(false)
    expect(isNightScore(700)).toBe(true)
    expect(isNightScore(1399)).toBe(true)
    expect(isNightScore(1400)).toBe(false)
  })

  it('fades in about a second and snaps ink at the halfway point', () => {
    const cycle = new DayNightCycle()
    expect(cycle.palette()).toEqual(DAY_PALETTE)
    for (let i = 0; i < 29; i++) cycle.update(700)
    expect(cycle.palette().ink).toBe(DAY_PALETTE.ink)
    for (let i = 0; i < 2; i++) cycle.update(700)
    expect(cycle.palette().ink).toBe(NIGHT_PALETTE.ink)
    for (let i = 0; i < 60; i++) cycle.update(700)
    expect(cycle.nightBlend).toBe(1)
    expect(cycle.palette()).toEqual(NIGHT_PALETTE)
    for (let i = 0; i < 60; i++) cycle.update(1400)
    expect(cycle.nightBlend).toBe(0)
  })

  it('reset returns to day immediately', () => {
    const cycle = new DayNightCycle()
    for (let i = 0; i < 60; i++) cycle.update(700)
    cycle.reset()
    expect(cycle.nightBlend).toBe(0)
  })
})

describe('mixHex', () => {
  it('interpolates and clamps', () => {
    expect(mixHex('#000000', '#FFFFFF', 0.5)).toBe('#808080')
    expect(mixHex('#000000', '#FFFFFF', -1)).toBe('#000000')
    expect(mixHex('#000000', '#FFFFFF', 2)).toBe('#FFFFFF')
  })

  it('rejects malformed colors', () => {
    expect(() => mixHex('red', '#FFFFFF', 0.5)).toThrow()
  })
})
