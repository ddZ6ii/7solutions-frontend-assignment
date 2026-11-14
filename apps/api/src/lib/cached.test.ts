import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vite-plus/test'

import { cached } from './cached.ts'

// Contract under test:
//   cached(load, { ttlMs }) returns a function `get` that resolves the value.
//   - a value is fresh for strictly less than ttlMs, expired at exactly ttlMs
//   - concurrent calls share one pending load
//   - failures are never cached: every waiting caller gets the error, and the
//     next call loads again (an expired value is not served on error)

const TTL_MS = 60_000

/** A promise you resolve or reject yourself, to control when `load` settles. */
const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

beforeEach(() => {
  // Also fakes Date.now(), so expiry is controlled with advanceTimersByTime
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('cached', () => {
  test('loads the value on the first call', async () => {
    const load = vi.fn().mockResolvedValue('v1')
    const get = cached(load, { ttlMs: TTL_MS })

    await expect(get()).resolves.toBe('v1')
    expect(load).toHaveBeenCalledOnce()
  })

  test('does not load anything until it is called', () => {
    const load = vi.fn().mockResolvedValue('v1')
    cached(load, { ttlMs: TTL_MS })

    expect(load).not.toHaveBeenCalled()
  })

  test('returns the stored value within the time limit', async () => {
    const load = vi.fn().mockResolvedValueOnce('v1').mockResolvedValue('v2')
    const get = cached(load, { ttlMs: TTL_MS })

    await get()
    vi.advanceTimersByTime(TTL_MS - 1)

    await expect(get()).resolves.toBe('v1')
    expect(load).toHaveBeenCalledOnce()
  })

  test('loads again once the time limit is reached', async () => {
    const load = vi.fn().mockResolvedValueOnce('v1').mockResolvedValue('v2')
    const get = cached(load, { ttlMs: TTL_MS })

    await get()
    vi.advanceTimersByTime(TTL_MS)

    await expect(get()).resolves.toBe('v2')
    expect(load).toHaveBeenCalledTimes(2)
  })

  test('counts the time limit from when the value was loaded, not requested', async () => {
    const pending = deferred<string>()
    const load = vi
      .fn()
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValue('v2')
    const get = cached(load, { ttlMs: TTL_MS })

    const first = get()
    vi.advanceTimersByTime(10_000) // the load takes 10s
    pending.resolve('v1')
    await first

    vi.advanceTimersByTime(TTL_MS - 1) // still fresh: 60s after the load ended

    await expect(get()).resolves.toBe('v1')
    expect(load).toHaveBeenCalledOnce()
  })

  test('shares one pending load between concurrent calls', async () => {
    const pending = deferred<string>()
    const load = vi.fn().mockReturnValue(pending.promise)
    const get = cached(load, { ttlMs: TTL_MS })

    const calls = [get(), get(), get()]
    pending.resolve('v1')

    await expect(Promise.all(calls)).resolves.toEqual(['v1', 'v1', 'v1'])
    expect(load).toHaveBeenCalledOnce()
  })

  test('shares one pending reload between concurrent calls after expiry', async () => {
    const reload = deferred<string>()
    const load = vi
      .fn()
      .mockResolvedValueOnce('v1')
      .mockReturnValueOnce(reload.promise)
    const get = cached(load, { ttlMs: TTL_MS })

    await get()
    vi.advanceTimersByTime(TTL_MS)
    const calls = [get(), get()]
    reload.resolve('v2')

    await expect(Promise.all(calls)).resolves.toEqual(['v2', 'v2'])
    expect(load).toHaveBeenCalledTimes(2)
  })

  test('gives the error to every waiting caller when the load fails', async () => {
    const pending = deferred<string>()
    const load = vi.fn().mockReturnValue(pending.promise)
    const get = cached(load, { ttlMs: TTL_MS })
    const error = new Error('upstream down')

    const calls = [get(), get()]
    pending.reject(error)

    await expect(calls[0]).rejects.toBe(error)
    await expect(calls[1]).rejects.toBe(error)
    expect(load).toHaveBeenCalledOnce()
  })

  test('does not cache a failure: the next call loads again', async () => {
    const error = new Error('upstream down')
    const load = vi.fn().mockRejectedValueOnce(error).mockResolvedValue('v1')
    const get = cached(load, { ttlMs: TTL_MS })

    await expect(get()).rejects.toBe(error)

    // No time passes: a failure must not be remembered, even for a moment
    await expect(get()).resolves.toBe('v1')
    expect(load).toHaveBeenCalledTimes(2)
  })

  test('returns the error, not the expired value, when a reload fails', async () => {
    const error = new Error('upstream down')
    const load = vi
      .fn()
      .mockResolvedValueOnce('v1')
      .mockRejectedValueOnce(error)
      .mockResolvedValue('v3')
    const get = cached(load, { ttlMs: TTL_MS })

    await get()
    vi.advanceTimersByTime(TTL_MS)

    await expect(get()).rejects.toBe(error)
    await expect(get()).resolves.toBe('v3')
  })

  test('keeps separate caches for separate instances', async () => {
    const getA = cached(vi.fn().mockResolvedValue('a'), { ttlMs: TTL_MS })
    const getB = cached(vi.fn().mockResolvedValue('b'), { ttlMs: TTL_MS })

    await expect(getA()).resolves.toBe('a')
    await expect(getB()).resolves.toBe('b')
  })
})
