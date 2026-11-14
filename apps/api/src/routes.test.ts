import { Hono } from 'hono'
import { describe, expect, test, vi } from 'vite-plus/test'

import type { DepartmentMap } from './departments/types.ts'
import { UpstreamError } from './lib/errors.ts'
import { registerRoutes } from './routes.ts'

// Contract under test:
//   registerRoutes(app, { getDepartments }) configures a Hono app, as
//   index.ts does. Tests pass a fake getDepartments, so they never touch the
//   network, the cache or timers.

const departments: DepartmentMap = {
  Engineering: {
    male: 1,
    female: 1,
    ageRange: '29-36',
    hair: { Brown: 2 },
    addressUser: { EmilyJohnson: '29112', MichaelWilliams: '38807' },
  },
}

// Literal on purpose: importing the constant from routes.ts would compare it
// with itself, so a typo in it would go unnoticed.
const DEPARTMENTS_CACHE_CONTROL =
  'public, s-maxage=300, stale-while-revalidate=600'

const setup = (getDepartments = vi.fn().mockResolvedValue(departments)) => ({
  app: registerRoutes(new Hono(), { getDepartments }),
  getDepartments,
})

/** Fake getDepartments that fails with the given error. */
const failingWith = (error: unknown) => vi.fn().mockRejectedValue(error)

describe('GET /departments', () => {
  test('responds 200 with the grouped departments as JSON', async () => {
    const { app, getDepartments } = setup()

    const res = await app.request('/departments')

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/^application\/json/)
    expect(await res.json()).toEqual(departments)
    expect(getDepartments).toHaveBeenCalledOnce()
  })

  test('lets CDNs cache the response', async () => {
    const { app } = setup()

    const res = await app.request('/departments')

    expect(res.headers.get('cache-control')).toBe(DEPARTMENTS_CACHE_CONTROL)
  })

  test('sends an ETag, and 304 with no body when it still matches', async () => {
    const { app } = setup()

    const first = await app.request('/departments')
    const etag = first.headers.get('etag')
    expect(etag).toBeTruthy()

    const second = await app.request('/departments', {
      headers: { 'If-None-Match': etag ?? '' },
    })

    expect(second.status).toBe(304)
    expect(await second.text()).toBe('')
  })
})

describe('GET /health', () => {
  test('responds 200 without loading departments, and is never cached', async () => {
    const { app, getDepartments } = setup()

    const res = await app.request('/health')

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'ok' })
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(getDepartments).not.toHaveBeenCalled()
  })
})

describe('unknown routes', () => {
  test('respond 404 with a JSON error, never cached', async () => {
    const { app } = setup()

    const res = await app.request('/nope')

    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not found' })
    expect(res.headers.get('cache-control')).toBe('no-store')
  })
})

describe('errors', () => {
  // Errors are logged: silence the output, and let tests assert on the calls
  const silenceErrorLog = () =>
    vi.spyOn(console, 'error').mockImplementation(() => {})

  test('responds 502 with a generic message when upstream fails', async () => {
    const logError = silenceErrorLog()
    const error = new UpstreamError(
      502,
      'Upstream responded with status 500 (secret detail)',
      { upstreamStatus: 500 },
    )
    const { app } = setup(failingWith(error))

    const res = await app.request('/departments')
    const body = await res.text()

    expect(res.status).toBe(502)
    expect(JSON.parse(body)).toEqual({ error: 'Upstream service unavailable' })
    expect(body).not.toContain('secret detail')
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(logError).toHaveBeenCalledWith(error)
  })

  test('responds 504 with a generic message when upstream times out', async () => {
    silenceErrorLog()
    const error = new UpstreamError(504, 'Upstream request timed out')
    const { app } = setup(failingWith(error))

    const res = await app.request('/departments')

    expect(res.status).toBe(504)
    expect(await res.json()).toEqual({ error: 'Upstream service timed out' })
    expect(res.headers.get('cache-control')).toBe('no-store')
  })

  test('responds 500 with a generic message on an unexpected error, and logs it', async () => {
    const logError = silenceErrorLog()
    const error = new Error('undefined is not a function (secret detail)')
    const { app } = setup(failingWith(error))

    const res = await app.request('/departments')
    const body = await res.text()

    expect(res.status).toBe(500)
    expect(JSON.parse(body)).toEqual({ error: 'Internal server error' })
    expect(body).not.toContain('secret detail')
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(logError).toHaveBeenCalledWith(error)
  })
})
