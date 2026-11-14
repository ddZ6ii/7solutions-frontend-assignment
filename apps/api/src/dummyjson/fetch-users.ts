import * as z from 'zod/mini'

import { UpstreamError, isTimeoutError } from '../lib/errors'
import { USER_FIELDS, UsersResponseSchema, type User } from './schema'

const UPSTREAM_TIMEOUT_MS = 5000

const USERS_URL = new URL('https://dummyjson.com/users')
USERS_URL.searchParams.set('limit', '0')
USERS_URL.searchParams.set('select', USER_FIELDS.join(','))

/**
 * Fetches all users (limit=0, instead of the default page of 30) from dummyjson and validates them.
 * Keep response small by selecting only the fields the schema validates.
 * Upstream failures throw an UpstreamError (502, or 504 on timeout).
 */
export async function fetchUsers(): Promise<User[]> {
  const signal = AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)

  const response = await callUpstream(
    () => fetch(USERS_URL, { signal }),
    'Upstream service unreachable',
  )

  if (!response.ok) {
    throw new UpstreamError(
      502,
      `Upstream responded with status ${response.status}`,
      { upstreamStatus: response.status },
    )
  }

  const body = await callUpstream(
    () => response.json(),
    'Upstream returned invalid JSON',
  )

  const result = UsersResponseSchema.safeParse(body)
  if (!result.success) {
    throw new UpstreamError(
      502,
      `Upstream returned an unexpected shape:\n${z.prettifyError(result.error)}`,
      { cause: result.error },
    )
  }

  return result.data.users
}

/**
 * Runs one step that talks to the upstream service and turns its failures
 * into an UpstreamError. Only network steps go through here, so bugs in our
 * own code are never mistaken for upstream failures.
 */
async function callUpstream<T>(
  step: () => Promise<T>,
  failureMessage: string,
): Promise<T> {
  try {
    return await step()
  } catch (error) {
    if (isTimeoutError(error)) {
      throw new UpstreamError(504, 'Upstream request timed out', {
        cause: error,
      })
    }
    // e.g. network failure -> TypeError('fetch failed') with cause.code ENOTFOUND / ECONNREFUSED
    // or not a JSON body -> SyntaxError from response.json()
    throw new UpstreamError(502, failureMessage, { cause: error })
  }
}
