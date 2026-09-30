import { describe, expect, it } from 'vitest'
import { GESTURE, TouchGestureClassifier } from './touch-gesture-classifier'

const T = GESTURE.swipeThresholdPx

describe('TouchGestureClassifier', () => {
  it('a quick tap is a short hop (jump start + end on lift)', () => {
    const g = new TouchGestureClassifier()
    expect(g.down(100, 0)).toEqual([])
    expect(g.move(102, 20)).toEqual([]) // tiny jitter stays pending
    expect(g.up()).toEqual(['jumpStart', 'jumpEnd'])
    expect(g.isActive).toBe(false)
  })

  it('holding still resolves to a held jump after decisionMs', () => {
    const g = new TouchGestureClassifier()
    g.down(100, 0)
    expect(g.timeout(GESTURE.decisionMs - 1)).toEqual([])
    expect(g.timeout(GESTURE.decisionMs)).toEqual(['jumpStart'])
    expect(g.timeout(500)).toEqual([]) // resolves only once
    expect(g.up()).toEqual(['jumpEnd'])
  })

  it('dragging down ducks until the finger lifts', () => {
    const g = new TouchGestureClassifier()
    g.down(100, 0)
    expect(g.move(100 + T, 30)).toEqual(['duckStart'])
    expect(g.move(100 + 3 * T, 60)).toEqual([])
    expect(g.move(100 - T, 90)).toEqual([]) // no switching back to jump mid-duck
    expect(g.up()).toEqual(['duckEnd'])
  })

  it('a slow downward drag after the decision window still ducks (jump → fast fall)', () => {
    const g = new TouchGestureClassifier()
    g.down(100, 0)
    expect(g.move(101, GESTURE.decisionMs)).toEqual(['jumpStart'])
    expect(g.move(100 + T, 150)).toEqual(['jumpEnd', 'duckStart'])
    expect(g.up()).toEqual(['duckEnd'])
  })

  it('dragging up jumps immediately without waiting', () => {
    const g = new TouchGestureClassifier()
    g.down(100, 0)
    expect(g.move(100 - T, 10)).toEqual(['jumpStart'])
    expect(g.up()).toEqual(['jumpEnd'])
  })

  it('a new touch first releases a stale unfinished one', () => {
    const g = new TouchGestureClassifier()
    g.down(100, 0)
    g.move(100 + T, 10)
    expect(g.down(50, 200)).toEqual(['duckEnd'])
    expect(g.isActive).toBe(true)
  })

  it('ignores lifts and timeouts when idle', () => {
    const g = new TouchGestureClassifier()
    expect(g.up()).toEqual([])
    expect(g.timeout(1000)).toEqual([])
    expect(g.move(0, 0)).toEqual([])
  })
})
