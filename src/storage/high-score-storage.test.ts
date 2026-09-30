import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { TelegramCloudStorage } from '../telegram/telegram-webapp-types'
import { HIGH_SCORE_KEY, HighScoreStore, parseHighScore } from './high-score-storage'

/** In-memory Web Storage implementation (Node has no localStorage). */
class MemoryStorage {
  private data = new Map<string, string>()
  getItem(key: string): string | null {
    return this.data.get(key) ?? null
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value)
  }
}

interface CloudOptions {
  fail?: boolean
  hang?: boolean
}

/** In-memory CloudStorage with the same callback contract as Telegram's; behavior switchable at runtime. */
function memoryCloud(initial: Record<string, string> = {}, options: CloudOptions = {}) {
  const data = new Map(Object.entries(initial))
  const cloud: TelegramCloudStorage = {
    getItem(key, callback) {
      if (options.hang) return
      if (options.fail) return callback('STORAGE_ERROR')
      callback(null, data.get(key) ?? '')
    },
    setItem(key, value, callback) {
      if (options.hang) return
      if (options.fail) return callback?.('STORAGE_ERROR')
      data.set(key, value)
      callback?.(null, true)
    },
  }
  return { cloud, data, options }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', new MemoryStorage())
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('parseHighScore', () => {
  it.each([
    ['123', 123],
    [' 42 ', 42],
    ['0', 0],
    ['9999999', 9999999],
  ])('accepts %j', (raw, expected) => {
    expect(parseHighScore(raw)).toBe(expected)
  })

  it.each([null, undefined, '', '-5', '1.5', '1e5', 'abc', '99999999', 42])('rejects %j', (raw) => {
    expect(parseHighScore(raw)).toBe(0)
  })
})

describe('HighScoreStore without Telegram', () => {
  it('round-trips through localStorage', async () => {
    const store = new HighScoreStore()
    await store.save(321)
    expect(localStorage.getItem(HIGH_SCORE_KEY)).toBe('321')
    expect(store.loadLocal()).toBe(321)
    expect(await store.loadCloud()).toBeUndefined()
  })

  it('never lowers the local value and ignores invalid scores', async () => {
    const store = new HighScoreStore()
    await store.save(500)
    await store.save(100)
    await store.save(-1)
    await store.save(1.5)
    expect(localStorage.getItem(HIGH_SCORE_KEY)).toBe('500')
  })

  it('survives a throwing localStorage', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('SecurityError')
      },
      setItem: () => {
        throw new Error('QuotaExceeded')
      },
    })
    const store = new HighScoreStore()
    await expect(store.save(5)).resolves.toBeUndefined()
    expect(store.loadLocal()).toBe(0)
  })
})

describe('HighScoreStore with CloudStorage', () => {
  it('reads the cloud value and writes higher records to both stores', async () => {
    const { cloud, data } = memoryCloud({ [HIGH_SCORE_KEY]: '250' })
    const store = new HighScoreStore(cloud)
    expect(await store.loadCloud()).toBe(250)
    await store.save(300)
    expect(data.get(HIGH_SCORE_KEY)).toBe('300')
    expect(localStorage.getItem(HIGH_SCORE_KEY)).toBe('300')
  })

  it('never overwrites a higher cloud score with a lower local record', async () => {
    const { cloud, data } = memoryCloud({ [HIGH_SCORE_KEY]: '900' })
    const store = new HighScoreStore(cloud)
    await store.save(40) // new device, cloud value not loaded yet
    expect(data.get(HIGH_SCORE_KEY)).toBe('900')
    expect(localStorage.getItem(HIGH_SCORE_KEY)).toBe('40')
  })

  it('skips the cloud write while the cloud is unreachable, then syncs once it recovers', async () => {
    vi.useFakeTimers()
    const { cloud, data, options } = memoryCloud({ [HIGH_SCORE_KEY]: '100' }, { hang: true })
    const store = new HighScoreStore(cloud)

    const load = store.loadCloud()
    await vi.advanceTimersByTimeAsync(3500)
    expect(await load).toBeUndefined()

    const blockedSave = store.save(150)
    await vi.advanceTimersByTimeAsync(3500)
    await blockedSave
    expect(data.get(HIGH_SCORE_KEY)).toBe('100')
    expect(localStorage.getItem(HIGH_SCORE_KEY)).toBe('150')

    options.hang = false
    await store.save(200)
    expect(data.get(HIGH_SCORE_KEY)).toBe('200')
  })

  it('treats cloud errors as unknown and keeps the local copy', async () => {
    const { cloud } = memoryCloud({}, { fail: true })
    const store = new HighScoreStore(cloud)
    expect(await store.loadCloud()).toBeUndefined()
    await expect(store.save(40)).resolves.toBeUndefined()
    expect(localStorage.getItem(HIGH_SCORE_KEY)).toBe('40')
  })

  it('keeps the local copy when the cloud write fails after a successful read', async () => {
    const { cloud, data, options } = memoryCloud({ [HIGH_SCORE_KEY]: '10' })
    const store = new HighScoreStore(cloud)
    await store.loadCloud()
    options.fail = true
    await store.save(20)
    expect(data.get(HIGH_SCORE_KEY)).toBe('10')
    expect(localStorage.getItem(HIGH_SCORE_KEY)).toBe('20')
  })
})
