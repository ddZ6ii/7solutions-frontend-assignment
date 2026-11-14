type CachedOptions = {
  /** How long a loaded value stays fresh, counted from when it finished loading. */
  ttlMs: number
  /** Clock, injectable for tests. Defaults to Date.now. */
  now?: () => number
}

/**
 * Wraps an async `load` function with an in-memory cache.
 *
 * - A loaded value is reused until `ttlMs` has passed since it was loaded.
 * - Concurrent calls while a load is in progress share that one load,
 *   so a burst of requests on an empty cache triggers a single upstream call.
 * - Failures are never cached: every waiting caller gets the error and the
 *   next call loads again. An expired value is not served on error.
 */
export function cached<T>(
  load: () => Promise<T>,
  { ttlMs, now = () => Date.now() }: CachedOptions,
): () => Promise<T> {
  // State lives in this closure, so each `cached(...)` has its own cache.
  let value: { data: T; expiresAt: number } | undefined
  let pending: Promise<T> | undefined

  return function get(): Promise<T> {
    // 1. Fresh value: reuse it.
    if (value !== undefined && now() < value.expiresAt) {
      return Promise.resolve(value.data)
    }

    // 2. A load is already in progress: share it instead of starting another.
    if (pending !== undefined) {
      return pending
    }

    // 3. Start a new load. `pending` is assigned in the same synchronous step
    //    as calling load(), so a concurrent call can't slip in between.
    pending = load().then(
      (data) => {
        // Runs LATER, once the data has arrived: the clock starts here.
        value = { data, expiresAt: now() + ttlMs }
        pending = undefined
        return data
      },
      (error: unknown) => {
        // Runs LATER, only on failure: store nothing, so the next call retries.
        pending = undefined
        throw error // re-throw, otherwise callers would receive `undefined`
      },
    )

    return pending
  }
}
