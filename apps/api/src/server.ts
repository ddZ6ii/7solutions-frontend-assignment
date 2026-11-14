// Local development server. On Vercel, the app exported by index.ts runs
// without this file.
import { serve } from '@hono/node-server'

import app from './index'

const port = Number(process.env.PORT ?? 3000)

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`)
})
