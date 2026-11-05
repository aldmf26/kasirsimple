// Last good copy of the data the POS needs (store, printer, products,
// categories, open shift), so the cashier can keep selling without internet.
// shortcut: localStorage (~5 MB) is enough for a warung catalog; move to
// IndexedDB if stores with thousands of products/photos show quota errors.
const PREFIX = 'kasirok_cache_'

export const saveOffline = (key: string, value: unknown) => {
  if (!import.meta.client) return
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // quota full or storage blocked: the app still works online
  }
}

export const loadOffline = <T>(key: string): T | null => {
  if (!import.meta.client) return null
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

// Supabase reports a dropped connection as an error message, not a status code.
export const isNetworkError = (e: unknown): boolean => {
  if (import.meta.client && !navigator.onLine) return true
  const message = (e as any)?.message || String(e ?? '')
  return /Failed to fetch|NetworkError|Load failed|fetch failed|Network request failed/i.test(message)
}

// The saved copy when `e` means "no internet"; null for real errors (keep failing).
export const offlineFallback = <T>(e: unknown, key: string): T | null =>
  isNetworkError(e) ? loadOffline<T>(key) : null
