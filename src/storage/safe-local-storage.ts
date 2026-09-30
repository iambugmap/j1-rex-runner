/**
 * localStorage wrappers that never throw. Storage can be unavailable (private mode, blocked
 * cookies, some webviews) and the game must keep working without persistence.
 */

export function readLocal(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null
  } catch {
    return null
  }
}

export function writeLocal(key: string, value: string): void {
  try {
    globalThis.localStorage?.setItem(key, value)
  } catch {
    // Quota exceeded or storage disabled: persistence is best-effort.
  }
}
