import { Hono } from 'hono'

import { getDepartments } from './departments/get-departments'
import { registerRoutes } from './routes'

// Vercel entry point. Vercel looks for a Hono app in app.ts, index.ts or
// server.ts (at the root or in src/), requires that file itself to import
// `hono`, and runs its default export. So the app is created here, and the
// routes live in routes.ts (a name Vercel doesn't scan).
// server.ts runs this same app locally.
const app = new Hono()
registerRoutes(app, { getDepartments })

export default app
