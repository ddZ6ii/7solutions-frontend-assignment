import { prettifyError, $ZodError } from 'zod/v4/core'

class ServerError extends Error {
  status: number
  constructor(message = 'Unexpected server error', cause?: unknown) {
    super(message, { cause })
    this.name = 'ServerError'
    this.status = 500
  }
}

class UpstreamError extends Error {
  status: number
  constructor(message: string, status: number, cause?: unknown) {
    super(message, { cause })
    this.name = 'UpstreamError'
    this.status = status
  }
}

class ValidationError extends Error {
  issues: $ZodError['issues']
  constructor(err: $ZodError) {
    const pretty = prettifyError(err)
    super(`Response validation failed: \n${pretty}`, {
      cause: err,
    })
    this.name = 'ValidationError'
    this.issues = err.issues
  }
}

const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'AbortError'

const isTimeoutError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'TimeoutError'

export {
  isAbortError,
  isTimeoutError,
  ServerError,
  UpstreamError,
  ValidationError,
}
