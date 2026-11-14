import { assert, describe, expect, test, vi } from 'vite-plus/test'

import { UpstreamError } from '../errors'
import { makeUsersResponse, userFixture } from '../test/user-fixtures'
import { fetchUsers } from './fetch-users'

// The setup file makes any un-mocked fetch reject, so tests never hit the network.

const respondWith = (body: string, status = 200) =>
  vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(new Response(body, { status }))

const respondWithJson = (body: unknown, status = 200) =>
  respondWith(JSON.stringify(body), status)

const failWith = (error: unknown) =>
  vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(error)

/** The URL and options fetch was called with, on its first call. */
const fetchCall = (spy: ReturnType<typeof respondWith>) => {
  const [input, init] = spy.mock.calls[0] ?? []
  if (!(input instanceof URL))
    throw new Error('fetch was not called with a URL')
  return { url: input, signal: init?.signal ?? undefined }
}

describe('fetchUsers', () => {
  test('returns the validated users', async () => {
    respondWithJson(makeUsersResponse([userFixture]))

    await expect(fetchUsers()).resolves.toEqual([userFixture])
  })

  test('requests all users with only the validated fields', async () => {
    const spy = respondWithJson(makeUsersResponse([]))

    await fetchUsers()
    const { url } = fetchCall(spy)

    expect(url.origin + url.pathname).toBe('https://dummyjson.com/users')
    expect(url.searchParams.get('limit')).toBe('0')
    expect(url.searchParams.get('select')).toBe(
      'firstName,lastName,age,gender,hair,address,company',
    )
  })

  test.each([404, 500, 503])(
    'throws a 502 UpstreamError when upstream responds %i',
    async (upstreamStatus) => {
      respondWithJson({ message: 'nope' }, upstreamStatus)

      await expect(fetchUsers()).rejects.toMatchObject({
        name: 'UpstreamError',
        status: 502,
        upstreamStatus,
      })
    },
  )

  test('throws a 502 UpstreamError when the body is not JSON', async () => {
    respondWith('<html>Service Unavailable</html>')

    const error = await fetchUsers().catch((e: unknown) => e)

    assert(error instanceof UpstreamError, 'expected an UpstreamError')
    expect(error).toMatchObject({ status: 502 })
    expect((error as UpstreamError).cause).toBeInstanceOf(SyntaxError)
  })

  test('throws a 502 UpstreamError naming the invalid field', async () => {
    respondWithJson({ users: [{ ...userFixture, age: 'old' }] })

    await expect(fetchUsers()).rejects.toMatchObject({
      status: 502,
      message: expect.stringContaining('age'),
    })
  })

  test('throws a 502 UpstreamError on a network failure, keeping the cause', async () => {
    const networkError = new TypeError('fetch failed', {
      cause: Object.assign(new Error('connect ECONNREFUSED'), {
        code: 'ECONNREFUSED',
      }),
    })
    failWith(networkError)

    const error = await fetchUsers().catch((e: unknown) => e)

    expect(error).toMatchObject({ name: 'UpstreamError', status: 502 })
    assert(error instanceof UpstreamError, 'expected an UpstreamError')
    expect(error.cause).toBe(networkError)
  })

  test('throws a 504 UpstreamError on timeout, keeping the cause', async () => {
    const timeoutError = new DOMException('timed out', 'TimeoutError')
    failWith(timeoutError)

    const error = await fetchUsers().catch((e: unknown) => e)

    expect(error).toMatchObject({ name: 'UpstreamError', status: 504 })
    assert(error instanceof UpstreamError, 'expected an UpstreamError')
    expect(error.cause).toBe(timeoutError)
  })

  test('passes a 5s timeout signal to fetch', async () => {
    const timeout = new AbortController()
    const timeoutSpy = vi
      .spyOn(AbortSignal, 'timeout')
      .mockReturnValue(timeout.signal)
    const spy = respondWithJson(makeUsersResponse([]))

    await fetchUsers()

    expect(timeoutSpy).toHaveBeenCalledWith(5000)
    expect(fetchCall(spy).signal).toBe(timeout.signal)
  })
})
