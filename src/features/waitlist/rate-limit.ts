const counters = new Map<string, { count: number; expiresAt: number }>()

/**
 * Simple in-process fixed-window limiter for single-container 1Panel deploys.
 * If you later run multiple replicas, replace this with Redis.
 */
export async function fixedWindowLimit(
  _store: unknown,
  key: string,
  limit: number,
  windowSec: number,
  nowMs: number,
): Promise<boolean> {
  const windowId = Math.floor(nowMs / 1000 / windowSec)
  const k = `rl:${key}:${windowId}`
  const existing = counters.get(k)
  if (existing && existing.expiresAt <= nowMs) counters.delete(k)

  const current = counters.get(k) ?? { count: 0, expiresAt: nowMs + windowSec * 2000 }
  if (current.count >= limit) return false
  counters.set(k, { ...current, count: current.count + 1 })
  return true
}
