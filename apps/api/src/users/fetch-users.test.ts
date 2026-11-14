import { describe, expect, test, vi } from 'vite-plus/test'

import { fetchUsers } from './fetch-users'
import { makeUsersPaginatedResponse, userFixture } from '../test/user-fixtures'
import { ServerError, UpstreamError, ValidationError } from '../errors'

const validResponse = makeUsersPaginatedResponse([userFixture])

const mockFetch = (body: unknown, status = 200) =>
  vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(new Response(JSON.stringify(body), { status }))

describe('fetchUsers', () => {
  test('returns parsed users on 200 with valid body', async () => {
    mockFetch(validResponse)

    await expect(fetchUsers()).resolves.toEqual(validResponse.users)
  })

  test('throws an UpstreamError on 404', async () => {
    mockFetch(null, 404)
    const error = await fetchUsers().catch((e: unknown) => e)

    expect(error).toBeInstanceOf(UpstreamError)
    expect((error as UpstreamError).status).toBe(404)
  })

  test('throws an UpstreamError on 500', async () => {
    mockFetch(null, 500)
    const error = await fetchUsers().catch((e: unknown) => e)

    expect(error).toBeInstanceOf(UpstreamError)
    expect((error as UpstreamError).status).toBe(500)
  })

  test('throws ValidationError on invalid response shape', async () => {
    mockFetch({ not: 'an array' })

    await expect(fetchUsers()).rejects.toBeInstanceOf(ValidationError)
  })

  test('re-throws an abord error without wrapping', async () => {
    const abortError = new DOMException('aborted', 'AbortError')
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(abortError)
    const error = await fetchUsers().catch((e: unknown) => e)

    expect(error).toBeInstanceOf(DOMException)
    expect((error as DOMException).name).toBe('AbortError')
  })

  test('throws UpstreamError on timeout', async () => {
    const timeoutError = new DOMException('timed out', 'TimeoutError')
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(timeoutError)
    const error = await fetchUsers().catch((e: unknown) => e)

    expect(error).toBeInstanceOf(UpstreamError)
    expect((error as UpstreamError).message).toBe('Timeout error')
  })

  test('throws ServerError on network failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(
      new TypeError('Failed to fetch'),
    )

    await expect(fetchUsers()).rejects.toBeInstanceOf(ServerError)
  })

  test('forwards the abort signal to fetch', async () => {
    const controller = new AbortController()
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify(validResponse), { status: 200 }),
      )
    await fetchUsers(undefined, controller.signal)

    expect(spy).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({ signal: controller.signal }),
    )
  })
})
