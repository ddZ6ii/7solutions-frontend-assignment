import { afterEach, beforeEach, vi } from 'vite-plus/test'

// Safety net: unit tests must never hit the real network. Any fetch call a
// test didn't mock explicitly fails loudly instead of calling dummyjson.
beforeEach(() => {
  vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Unmocked fetch'))
})

afterEach(() => {
  vi.restoreAllMocks()
})
