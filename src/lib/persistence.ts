/** Local persistence for the prototype only; this is not secure or server-side storage. */
export function readStored<T>(key: string, fallback: T, isValid?: (value: unknown) => value is T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback

    const parsed: unknown = JSON.parse(raw)
    if (isValid) return isValid(parsed) ? parsed : fallback

    // Defensive default for calls without a schema guard.
    if (Array.isArray(fallback)) return (Array.isArray(parsed) ? parsed : fallback) as T
    if (fallback && typeof fallback === 'object') {
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as T : fallback
    }
    return typeof parsed === typeof fallback ? parsed as T : fallback
  } catch {
    return fallback
  }
}

export function writeStored<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage can be unavailable in private or restricted browsing modes.
  }
}
