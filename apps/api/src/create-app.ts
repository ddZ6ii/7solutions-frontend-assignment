import { Hono } from 'hono'
import { etag } from 'hono/etag'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

import type { DepartmentMap } from './departments/types'
import { HttpError } from './lib/errors'

/**
 * CDN cache: the outer layer, in front of the in-memory cache
 * (departments/get-departments.ts).
 * - `public`: shared caches (CDNs) may store the response.
 * - `s-maxage=300`: for 5 min the CDN answers with its copy; the request never
 *   reaches this function.
 * - `stale-while-revalidate=600`: for the next 10 min the CDN still answers
 *   instantly with the old copy, and refreshes it from this function in the
 *   background.
 * Only successful responses use this; errors are sent with `no-store`.
 */
const CDN_DEPARTMENTS_CACHE_CONTROL =
  'public, s-maxage=300, stale-while-revalidate=600'

const PUBLIC_ERROR_MESSAGES: Partial<Record<number, string>> = {
  502: 'Upstream service unavailable',
  504: 'Upstream service timed out',
}

type Deps = { getDepartments: () => Promise<DepartmentMap> }

const createApp = ({ getDepartments }: Deps) => {
  const app = new Hono()

  // ETag: not a cache, a check for copies that already exist (mostly the
  // browser's, which `s-maxage` gives no freshness time). Each response gets a
  // hash of its body; when a client sends it back in If-None-Match and it still
  // matches, it gets 304 Not Modified with no body instead of the full JSON.
  // Saves bandwidth, not work: the handler still runs to compute the hash.
  app.use('/departments', etag())

  app.get('/departments', async (c) => {
    const departmentSummary = await getDepartments()
    // Set only once the data was loaded, so a failed request is never cacheable
    c.header('Cache-Control', CDN_DEPARTMENTS_CACHE_CONTROL)
    return c.json(departmentSummary, 200)
  })

  app.get('/health', (c) => {
    c.header('Cache-Control', 'no-store')
    return c.json({ status: 'ok' }, 200)
  })

  // Every error thrown from a route ends up here. Details go to the logs;
  // the client only gets a fixed message for the status.
  app.onError((err, c) => {
    console.error(err)

    const status = err instanceof HttpError ? err.status : 500
    const message = PUBLIC_ERROR_MESSAGES[status] ?? 'Internal server error'
    c.header('Cache-Control', 'no-store')
    return c.json(
      {
        error: message,
      },
      status as ContentfulStatusCode,
    )
  })

  app.notFound((c) => {
    c.header('Cache-Control', 'no-store')
    return c.json({ error: 'Not found' }, 404)
  })

  return app
}

export { createApp }
