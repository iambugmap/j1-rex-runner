import type { TelegramCloudStorage } from '../telegram/telegram-webapp-types'
import { readLocal, writeLocal } from './safe-local-storage'

/**
 * High score persistence: localStorage always, plus Telegram CloudStorage (per-user,
 * cross-device) when available. Writes are monotonic — a stored score is only ever replaced
 * by a higher one — and the cloud is never written before its current value is known, so a
 * slow/offline cloud can't cause a fresh device to overwrite a better score from elsewhere.
 * Stored values are user-controllable, so every read is validated.
 */

export const HIGH_SCORE_KEY = 'j1rex_high_score'
export const MAX_VALID_SCORE = 9_999_999
const CLOUD_TIMEOUT_MS = 3000

/** Parses a stored value into a safe non-negative integer score; anything invalid → 0. */
export function parseHighScore(raw: unknown): number {
  if (typeof raw !== 'string' || !/^\d{1,7}$/.test(raw.trim())) return 0
  const value = Number(raw.trim())
  return value <= MAX_VALID_SCORE ? value : 0
}

const isValidScore = (score: number): boolean => Number.isInteger(score) && score >= 0 && score <= MAX_VALID_SCORE

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('CloudStorage timed out')), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error: unknown) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

function cloudGet(cloud: TelegramCloudStorage, key: string): Promise<string | undefined> {
  return new Promise((resolve, reject) => {
    cloud.getItem(key, (error, value) => (error ? reject(new Error(error)) : resolve(value)))
  })
}

function cloudSet(cloud: TelegramCloudStorage, key: string, value: string): Promise<void> {
  return new Promise((resolve, reject) => {
    cloud.setItem(key, value, (error) => (error ? reject(new Error(error)) : resolve()))
  })
}

export class HighScoreStore {
  /** Last value confirmed in the cloud; undefined until a cloud read succeeds. */
  private cloudValue: number | undefined

  constructor(private readonly cloud?: TelegramCloudStorage) {}

  /** Synchronous local value so the HUD can show HI immediately. */
  loadLocal(): number {
    return parseHighScore(readLocal(HIGH_SCORE_KEY))
  }

  /** Reads the cloud value; resolves undefined when there is no cloud or it is unreachable. */
  async loadCloud(): Promise<number | undefined> {
    if (!this.cloud) return undefined
    try {
      const raw = await withTimeout(cloudGet(this.cloud, HIGH_SCORE_KEY), CLOUD_TIMEOUT_MS)
      this.cloudValue = Math.max(this.cloudValue ?? 0, parseHighScore(raw))
      return this.cloudValue
    } catch {
      return undefined
    }
  }

  /** Persists a new record; never lowers a stored value locally or in the cloud. */
  async save(score: number): Promise<void> {
    if (!isValidScore(score)) return
    if (score > this.loadLocal()) writeLocal(HIGH_SCORE_KEY, String(score))
    if (!this.cloud) return

    // Unknown cloud value (earlier read failed/timed out): read before deciding to write.
    const known = this.cloudValue ?? (await this.loadCloud())
    if (known === undefined || score <= known) return
    try {
      await withTimeout(cloudSet(this.cloud, HIGH_SCORE_KEY, String(score)), CLOUD_TIMEOUT_MS)
      this.cloudValue = score
    } catch {
      // Local copy is saved; the next record retries the cloud.
    }
  }
}
