import { createApp } from './create-app'
import { getDepartments } from './departments/get-departments'

// Vercel entry point: Vercel looks for a Hono app in app.ts, index.ts or
// server.ts (at the root or in src/) and runs its default export. Keep this
// the only file at those paths exporting the app: that's why the factory
// lives in create-app.ts, not app.ts. (server.ts only imports from here.)
export default createApp({ getDepartments })
