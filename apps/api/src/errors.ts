/**
 * Error with the HTTP status this API should answer with.
 * The route's error handler only needs one `instanceof HttpError` check;
 * anything else is an unexpected bug and becomes a 500.
 *
 * `message` is detailed and meant for logs. The HTTP response should use a
 * generic text for the status instead, so internals never reach the client.
 */
class HttpError extends Error {
  override name = 'HttpError'
  readonly status: number

  constructor(status: number, message: string, options?: ErrorOptions) {
    super(message, options)
    this.status = status
  }
}

type UpstreamErrorOptions = ErrorOptions & {
  /** Status returned by the upstream service, kept for logs. */
  upstreamStatus?: number
}

/**
 * The upstream service (dummyjson) failed. The client's request was fine,
 * so this API answers like a gateway:
 * - 502 Bad Gateway: unreachable, non-2xx, invalid JSON or invalid shape
 * - 504 Gateway Timeout: no answer in time
 */
class UpstreamError extends HttpError {
  override name = 'UpstreamError'
  readonly upstreamStatus: number | undefined

  constructor(
    status: 502 | 504,
    message: string,
    options?: UpstreamErrorOptions,
  ) {
    super(status, message, options)
    this.upstreamStatus = options?.upstreamStatus
  }
}

/** Raised by `AbortSignal.timeout()` when the time limit is reached. */
const isTimeoutError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'TimeoutError'

export { HttpError, UpstreamError, isTimeoutError }
