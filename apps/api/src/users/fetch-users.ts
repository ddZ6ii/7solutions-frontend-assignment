import { $ZodError } from 'zod/v4/core'

import {
  isAbortError,
  isTimeoutError,
  ServerError,
  UpstreamError,
  ValidationError,
} from '../errors'
import {
  UserQueryParamsSchema,
  UsersPaginatedResponseSchema,
  type User,
  type UserQueryParams,
} from './schema'

const API_BASE_URL = 'https://dummyjson.com'

export const fetchUsers = async (
  queryParams: UserQueryParams = {},
  signal = AbortSignal.timeout(5000),
): Promise<User[]> => {
  try {
    const parsedParams = UserQueryParamsSchema.parse(queryParams)

    const url = new URL('/users', API_BASE_URL)
    url.search = new URLSearchParams(parsedParams).toString()

    const response = await fetch(url, { signal })

    // Non-2xx reponse
    if (!response.ok)
      throw new UpstreamError(
        `${response.status.toString()} ${response.statusText} — ${response.url}`,
        response.status,
      )

    const json = await response.json()
    const paginatedUsers = UsersPaginatedResponseSchema.parse(json)

    return paginatedUsers.users
  } catch (error: unknown) {
    if (isAbortError(error)) throw error // caller cancelled (not our failure) -> re-throw
    if (isTimeoutError(error)) throw new UpstreamError('Timeout error', 504)
    if (error instanceof $ZodError) throw new ValidationError(error)
    if (error instanceof UpstreamError) throw error
    throw new ServerError()
  }
}
