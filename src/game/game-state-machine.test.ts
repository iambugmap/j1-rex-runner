import { describe, expect, it } from 'vitest'
import { CRASH_RESTART_COOLDOWN_STEPS, RESUME_COUNTDOWN_STEPS, SPEED, WORLD } from '../config/game-balance-constants'
import { createSeededRandom } from '../engine/seeded-random'
import { GameSession, type GameEvent } from './game-state-machine'

function newSession(seed = 1) {
  const session = new GameSession(createSeededRandom(seed))
  const events: GameEvent[] = []
  session.onEvent((event) => events.push(event))
  return { session, events }
}

function runUntilCrash(session: GameSession, maxSteps = 50_000): void {
  for (let i = 0; i < maxSteps && session.phase === 'running'; i++) session.step()
}

/**
 * Simple reactive bot: jumps cacti / low birds, ducks mid birds, ignores high birds.
 * Used to prove the generated obstacle course is actually beatable.
 */
function botStep(session: GameSession): void {
  const player = session.player
  const ahead = session.obstacles.items.find((o) => o.x + o.width > player.x + 4)
  if (!player.isAirborne) session.releaseJump()
  if (!ahead) return session.releaseDuck()

  const distance = ahead.x - (player.x + 36)
  const liftBottom = WORLD.groundY - (ahead.y + ahead.frames[0].height)
  if (ahead.kind === 'ptero' && liftBottom >= 62) return session.releaseDuck()
  if (ahead.kind === 'ptero' && liftBottom >= 30) {
    if (distance < 60 && !player.isAirborne) session.pressDuck()
    else if (distance >= 60) session.releaseDuck()
    return
  }
  session.releaseDuck()
  if (!player.isAirborne && distance < session.speed * 7) session.pressJump()
}

describe('GameSession', () => {
  it('starts in ready state and first jump starts the run', () => {
    const { session, events } = newSession()
    expect(session.phase).toBe('ready')
    session.step()
    expect(session.score.score).toBe(0) // nothing moves before start
    session.pressJump()
    expect(session.phase).toBe('running')
    expect(events).toEqual(['start', 'jump'])
  })

  it('accelerates up to the max speed', () => {
    const { session } = newSession()
    session.pressJump()
    session.step()
    expect(session.speed).toBeGreaterThan(SPEED.start)
    runUntilCrash(session, 10)
    expect(session.speed).toBeLessThanOrEqual(SPEED.max)
  })

  it('crashes into an obstacle when nobody plays, emitting crash and record', () => {
    const { session, events } = newSession(3)
    session.pressJump()
    session.releaseJump()
    runUntilCrash(session)
    expect(session.phase).toBe('crashed')
    expect(events).toContain('crash')
    expect(events.at(-1)).toBe('record')
    expect(session.score.highScore).toBe(session.score.score)
    expect(session.player.pose).toBe('crash')
  })

  it('ignores restart during the cooldown, then restarts with a fresh run', () => {
    const { session } = newSession(3)
    session.pressJump()
    runUntilCrash(session)
    const high = session.score.highScore

    session.pressJump()
    expect(session.phase).toBe('crashed')
    for (let i = 0; i < CRASH_RESTART_COOLDOWN_STEPS; i++) session.step()
    expect(session.canRestart).toBe(true)
    session.pressJump()

    expect(session.phase).toBe('running')
    expect(session.score.score).toBe(0)
    expect(session.speed).toBe(SPEED.start)
    expect(session.obstacles.items).toHaveLength(0)
    expect(session.score.highScore).toBe(high)
  })

  it('pauses only while running and resumes through a 3-2-1 countdown without jumping', () => {
    const { session, events } = newSession()
    session.pause()
    expect(session.phase).toBe('ready')

    session.pressJump()
    session.releaseJump()
    session.pause()
    expect(session.phase).toBe('paused')
    const scoreBefore = session.score.score
    for (let i = 0; i < 100; i++) session.step()
    expect(session.score.score).toBe(scoreBefore)

    const jumpsBefore = events.filter((e) => e === 'jump').length
    session.pressJump()
    expect(session.phase).toBe('resuming')
    expect(session.resumeCountdown).toBe(3)
    session.pressJump() // taps during the countdown are ignored
    const seenDigits = new Set<number>()
    for (let i = 0; i < RESUME_COUNTDOWN_STEPS - 1; i++) {
      session.step()
      seenDigits.add(session.resumeCountdown)
    }
    expect([...seenDigits].sort()).toEqual([1, 2, 3])
    expect(session.score.score).toBe(scoreBefore) // world frozen during countdown
    session.step()
    expect(session.phase).toBe('running')
    expect(session.resumeCountdown).toBe(0)
    expect(events.filter((e) => e === 'jump').length).toBe(jumpsBefore)
  })

  it('can be paused again during the resume countdown', () => {
    const { session } = newSession()
    session.pressJump()
    session.pause()
    session.pressJump()
    session.pause()
    expect(session.phase).toBe('paused')
  })

  it('ignores duck input unless running', () => {
    const { session } = newSession()
    session.pressDuck()
    expect(session.player.pose).toBe('idle')
  })

  it('seeds the high score from storage without lowering it', () => {
    const { session } = newSession()
    session.setHighScore(250)
    session.setHighScore(100)
    expect(session.score.highScore).toBe(250)
  })

  it('stops notifying unsubscribed listeners', () => {
    const session = new GameSession(createSeededRandom(1))
    const events: GameEvent[] = []
    const unsubscribe = session.onEvent((e) => events.push(e))
    unsubscribe()
    session.pressJump()
    expect(events).toEqual([])
  })

  it.each([1, 2, 3, 4, 5])('obstacle course is beatable: a simple bot passes milestones (seed %i)', (seed) => {
    const { session, events } = newSession(seed)
    session.pressJump()
    for (let i = 0; i < 60_000 && session.phase === 'running'; i++) {
      botStep(session)
      session.step()
    }
    expect(session.score.score).toBeGreaterThanOrEqual(450)
    expect(events).toContain('milestone')
  })
})
