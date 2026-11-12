import { cleanup } from '@testing-library/react'
import { afterEach } from 'vite-plus/test'

// Testing Library only auto-cleans when test globals are enabled.
// We import test APIs explicitly, so unmount rendered trees ourselves.
afterEach(cleanup)
